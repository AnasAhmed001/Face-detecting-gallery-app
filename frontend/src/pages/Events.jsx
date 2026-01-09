import { useState } from "react";
import { useEvents } from "../hooks/useEvents";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus } from "lucide-react";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Events = () => {
  const { userId } = useUserContext();
  const { events, loading, deleteEventById, createNewEvent } =
    useEvents(userId);
  const navigate = useNavigate();

  // Create Event Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "" });

  const openCreate = () => setIsCreateOpen(true);
  const closeCreate = () => {
    setIsCreateOpen(false);
    setForm({ name: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async () => {
    if (!form.name) return;
    const eventData = {
      name: form.name,
      userId: userId
    };
    await createNewEvent(eventData);
    closeCreate();
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Your Events
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and view your event galleries
            </p>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first event to start building your gallery
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event._id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                onClick={() =>
                  navigate(`/events/${event._id}`, {
                    state: { name: event.name },
                  })
                }
              >
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                          <span className="text-2xl font-bold text-foreground">
                            {event.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">
                          {event.name}
                        </h3>
                        {event.eventId && (
                          <div className="mt-2">
                            <Badge variant="secondary">
                              ID: {event.eventId}
                            </Badge>
                          </div>
                        )}
                        <div className="mt-3 text-sm text-muted-foreground">
                          Created {formatDate(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="px-6 py-4 bg-card border-t flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEventById(event._id); 
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={closeCreate}
          title="Create New Event"
          titleClassName="text-center"
          actions={
            <>
              <Button
                onClick={handleCreateSubmit}
                disabled={!form.name}
                className="flex items-center gap-2 cursor-pointer"
              >
                Create Event
              </Button>
              <Button variant="outline" onClick={closeCreate} className="mr-2 cursor-pointer">
                Cancel
              </Button>
            </>
          }
        >
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Event Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Enter event name"
                className="w-full max-w-xs mx-auto rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 block"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Your userId will be included automatically when creating the event.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Events;
