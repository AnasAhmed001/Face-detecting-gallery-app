"""
Modal Labs Face Processing Service
Replaces the Docker-based Python worker with serverless functions
"""
import modal
import os
from io import BytesIO
from datetime import datetime
import hashlib
import numpy as np
from PIL import Image
import cv2

# Create Modal app
app = modal.App("face-processing-service")

# Define the image with dependencies
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0")
    .pip_install(
        "insightface==0.7.3",
        "onnxruntime==1.16.3",
        "opencv-python==4.8.1.78",
        "pillow==10.1.0",
        "numpy==1.24.3",
        "pymongo==4.6.0",
        "minio==7.2.0",
        "qdrant-client==1.7.0",
    )
    .run_commands(
        "python -c 'from insightface.app import FaceAnalysis; "
        "app = FaceAnalysis(name=\"buffalo_l\"); "
        "app.prepare(ctx_id=-1)'"
    )
)

# Environment secrets
secrets = modal.Secret.from_dict({
    "MONGO_URI": os.getenv("MONGO_URI", ""),
    "R2_ACCOUNT_ID": os.getenv("R2_ACCOUNT_ID", ""),
    "R2_ACCESS_KEY_ID": os.getenv("R2_ACCESS_KEY_ID", ""),
    "R2_SECRET_ACCESS_KEY": os.getenv("R2_SECRET_ACCESS_KEY", ""),
    "R2_BUCKET": os.getenv("R2_BUCKET", ""),
    "QDRANT_URL": os.getenv("QDRANT_URL", ""),
    "QDRANT_API_KEY": os.getenv("QDRANT_API_KEY", ""),
})


def generate_face_id(image_key, face_index):
    """Generate unique face ID from image key and face index"""
    return hashlib.md5(f"{image_key}_{face_index}".encode()).hexdigest()


def create_derivatives(image_bytes):
    """Create thumbnail and medium-sized derivatives from raw image"""
    img = Image.open(BytesIO(image_bytes))

    if img.mode == 'RGBA':
        img = img.convert('RGB')

    # Medium derivative (max 1200px)
    md_img = img.copy()
    md_img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    md_buffer = BytesIO()
    md_img.save(md_buffer, format='JPEG', quality=85)
    md_bytes = md_buffer.getvalue()

    # Thumbnail (max 400px)
    thumb_img = img.copy()
    thumb_img.thumbnail((400, 400), Image.Resampling.LANCZOS)
    thumb_buffer = BytesIO()
    thumb_img.save(thumb_buffer, format='WEBP', quality=80)
    thumb_bytes = thumb_buffer.getvalue()

    return md_bytes, thumb_bytes


@app.function(
    image=image,
    secrets=[secrets],
    timeout=600,
    memory=2048,
)
@modal.web_endpoint(method="POST")
def detect_faces(data: dict):
    """Detect faces in an image, create derivatives, and store metadata"""
    from insightface.app import FaceAnalysis
    from minio import Minio
    from pymongo import MongoClient
    from qdrant_client import QdrantClient
    from qdrant_client.models import PointStruct

    user_id = data['userId']
    event_id = data['eventId']
    image_key = data['imageKey']

    print(f"Processing image: {image_key}")

    try:
        # Initialize services
        r2_client = Minio(
            f"{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            access_key=os.environ['R2_ACCESS_KEY_ID'],
            secret_key=os.environ['R2_SECRET_ACCESS_KEY'],
            secure=True,
            region='auto'
        )

        mongo_client = MongoClient(os.environ['MONGO_URI'])
        db = mongo_client.get_default_database()

        qdrant_client = QdrantClient(
            url=os.environ['QDRANT_URL'],
            api_key=os.environ['QDRANT_API_KEY']
        )

        # Initialize InsightFace
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=-1, det_size=(640, 640))

        # Download image from R2
        response = r2_client.get_object(data['bucket'], image_key)
        image_bytes = response.read()
        response.close()
        response.release_conn()

        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Failed to decode image"}

        # Detect faces
        faces = face_app.get(img)
        print(f"Detected {len(faces)} faces")

        if len(faces) == 0:
            return {"message": "No faces detected", "faceCount": 0}

        # Create derivatives
        md_bytes, thumb_bytes = create_derivatives(image_bytes)

        # Generate paths
        base_name = image_key.split('/')[-1].split('.')[0]
        base_path = f"saylani-moments/{user_id}/{event_id}"
        md_key = f"{base_path}/derivative/md/{base_name}.jpg"
        thumb_key = f"{base_path}/derivative/thumb/{base_name}.webp"

        # Upload derivatives
        r2_client.put_object(
            data['bucket'], md_key,
            BytesIO(md_bytes), len(md_bytes),
            content_type='image/jpeg'
        )
        r2_client.put_object(
            data['bucket'], thumb_key,
            BytesIO(thumb_bytes), len(thumb_bytes),
            content_type='image/webp'
        )

        # Process each face
        face_ids = []
        for idx, face in enumerate(faces):
            face_id = generate_face_id(md_key, idx)
            embedding = face.embedding.tolist()
            bbox = face.bbox.tolist()

            # Store metadata in MongoDB
            db['face_metadata'].update_one(
                {'faceId': face_id},
                {'$set': {
                    'faceId': face_id,
                    'eventId': event_id,
                    'imageKey': md_key,
                    'bbox': bbox,
                    'confidence': float(face.det_score),
                    'createdAt': datetime.utcnow(),
                }},
                upsert=True
            )

            # Store embedding in Qdrant
            qdrant_client.upsert(
                collection_name='faces',
                points=[PointStruct(
                    id=face_id,
                    vector=embedding,
                    payload={'faceId': face_id, 'eventId': event_id, 'imageKey': md_key}
                )]
            )

            face_ids.append(face_id)

        # Store image metadata
        db['face_images'].update_one(
            {'mdKey': md_key},
            {'$set': {
                'eventId': event_id,
                'originalKey': image_key,
                'mdKey': md_key,
                'thumbKey': thumb_key,
                'faceCount': len(faces),
                'processedAt': datetime.utcnow(),
            }},
            upsert=True
        )

        print(f"Successfully processed {len(faces)} faces")

        return {
            "success": True,
            "faceCount": len(faces),
            "faceIds": face_ids,
            "mdKey": md_key,
            "thumbKey": thumb_key,
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}


@app.function(
    image=image,
    secrets=[secrets],
    timeout=60,
    memory=2048,
)
@modal.web_endpoint(method="POST")
def match_face(data: dict):
    """Match a selfie against faces in an event"""
    import base64
    from insightface.app import FaceAnalysis
    from qdrant_client import QdrantClient

    event_id = data['eventId']
    selfie_base64 = data['selfieBase64']
    threshold = data.get('threshold', 0.75)

    print(f"Matching face in event: {event_id}")

    try:
        # Initialize services
        qdrant_client = QdrantClient(
            url=os.environ['QDRANT_URL'],
            api_key=os.environ['QDRANT_API_KEY']
        )

        # Initialize InsightFace
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=-1, det_size=(640, 640))

        # Decode selfie
        selfie_bytes = base64.b64decode(selfie_base64)
        nparr = np.frombuffer(selfie_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Failed to decode selfie"}

        # Detect face
        faces = face_app.get(img)

        if len(faces) == 0:
            return {"message": "No face detected in selfie", "matches": []}

        # Use first detected face
        selfie_embedding = faces[0].embedding.tolist()

        # Search Qdrant
        search_results = qdrant_client.search(
            collection_name='faces',
            query_vector=selfie_embedding,
            limit=100,
            score_threshold=threshold,
            query_filter={
                "must": [{"key": "eventId", "match": {"value": event_id}}]
            }
        )

        matches = [
            {
                'faceId': result.payload['faceId'],
                'imageKey': result.payload['imageKey'],
                'similarity': result.score * 100,
            }
            for result in search_results
        ]

        print(f"Found {len(matches)} matches")

        return {
            "success": True,
            "matches": matches,
            "totalMatches": len(matches),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e)}
