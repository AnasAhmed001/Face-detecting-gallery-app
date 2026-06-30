let END_POINTS = {
  API_BASE_URL: "http://localhost:5000/api/",
  //EVENTS
  GET_EVENTS_BY_USER_ID: "/events/user",
  CREATE_EVENT: "/events/create",
  DELETE_EVENT: "/events/delete",
  EDIT_EVENT: "/events/update",

  //PHOTOGRAPHERS
  ADD_PHOTOGRAHERS: "/users/add",
  GET_ALL_PHOTOGRAPHERS: "/users/photographers",
  DELETE_PHOTOGRAPHER: "/users/delete/",
  EDIT_PHOTOGRAPHER: "/users/",

  //DASHBOARD
  GET_TOTAL_PHOTOS: "/dashboard/photos",

    // IMAGES
  GET_IMAGES: "/images",
    //BUCKET LINK
  BUCKET_URL: "https://saylanimoment.s3.us-east-1.amazonaws.com/",
};

export default END_POINTS;