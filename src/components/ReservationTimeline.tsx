import React, { useMemo, useState } from "react";
import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import { Box, CircularProgress } from "@mui/material";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/ReservationTimeline.css";

const localizer = momentLocalizer(moment);

interface ReservationTimelineProps {
  events: ProcessedEvent[];
  onSelectEvent: (event: ProcessedEvent) => void;
  selectedDate: moment.Moment | null;
  isLoading?: boolean;
  onNavigate?: (date: Date, view: string) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date; action: string }) => void;
}

interface CalendarEvent {
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  resource: ProcessedEvent;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "CONFIRMED":
      return "#00ff7f"; // springgreen
    case "PENDING":
      return "#ff8c00"; // darkorange
    case "CANCELLED":
      return "#dc143c"; // crimson
    default:
      return "#e91e63"; // primary color
  }
};

const ReservationTimeline: React.FC<ReservationTimelineProps> = ({
  events,
  onSelectEvent,
  selectedDate,
  isLoading = false,
  onNavigate,
  onSelectSlot,
}) => {
  const [currentView, setCurrentView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState<Date>(
    selectedDate?.toDate() || new Date()
  );

  // Convert ProcessedEvent to react-big-calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.event_id,
      title: event.title,
      start: event.start,
      end: event.end,
      resource: event,
    }));
  }, [events]);

  const handleSelectEvent = (event: CalendarEvent) => {
    onSelectEvent(event.resource);
  };

  const handleNavigate = (newDate: Date, view: any) => {
    setCurrentDate(newDate);
    if (onNavigate) {
      onNavigate(newDate, view);
    }
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    // When toggling between day/week, trigger fetch for the new range
    if (onNavigate) {
      onNavigate(currentDate, newView);
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    if (onSelectSlot) {
      onSelectSlot({
        start: slotInfo.start,
        end: slotInfo.end,
        action: slotInfo.action,
      });
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = getStatusColor(event.resource.data.status);
    const style = {
      backgroundColor,
      borderRadius: "6px",
      opacity: 1,
      color: "white",
      border: "2px solid white",
      display: "block",
      fontWeight: "600" as const,
      fontSize: "12px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
      padding: "4px 6px",
    };

    return { style };
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          minHeight: "600px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: "600px",
        "& .rbc-calendar": {
          fontFamily: "inherit",
        },
        "& .rbc-header": {
          padding: "10px 3px",
          fontWeight: 600,
          fontSize: "0.875rem",
        },
        "& .rbc-time-slot": {
          fontSize: "0.75rem",
        },
        "& .rbc-timeslot-group": {
          minHeight: "60px",
          borderBottom: "1px solid #e0e0e0",
        },
        "& .rbc-day-bg": {
          borderLeft: "1px solid #e0e0e0",
        },
        "& .rbc-off-range-bg": {
          backgroundColor: "#fafafa",
        },
        "& .rbc-event": {
          padding: "4px 6px",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            opacity: 1,
            transform: "scale(1.02)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.25)",
            zIndex: 10,
          },
        },
        "& .rbc-event-label": {
          fontSize: "0.75rem",
        },
        "& .rbc-event-content": {
          whiteSpace: "normal",
          fontSize: "0.75rem",
        },
        "& .rbc-toolbar": {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "15px 0",
          marginBottom: "0",
          flexWrap: "nowrap",
          gap: "12px",
          "& button": {
            padding: "6px 12px",
            fontSize: "0.875rem",
            borderRadius: "4px",
            border: "1px solid #ddd",
            backgroundColor: "white",
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": {
              backgroundColor: "#f5f5f5",
            },
            "&.rbc-active": {
              backgroundColor: "#e91e63",
              color: "white",
              border: "1px solid #e91e63",
            },
          },
          "& .rbc-toolbar-label": {
            fontSize: "1rem",
            fontWeight: 600,
            color: "#333",
            flex: "1 1 auto",
            textAlign: "center",
            margin: "0 12px",
          },
        },
        "& .rbc-current-time-indicator": {
          backgroundColor: "#e91e63",
          height: "2px",
        },
      }}
    >
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        eventPropGetter={eventStyleGetter}
        view={currentView}
        date={currentDate}
        views={["week", "day"]}
        step={30}
        min={moment().startOf("day").hour(6).toDate()}
        max={moment().startOf("day").hour(22).toDate()}
        showMultiDayTimes
        popup
        selectable={true}
      />
    </Box>
  );
};

export default ReservationTimeline;
