"use server";

import {prisma} from "@/db/prisma";
import {logEvent} from "@/utils/sentry";
import {revalidatePath} from "next/cache";
import {getCurrentUser} from "./auth.action";

type State = {
  success: boolean;
  message: string;
};

export const createTicket = async (
  prevState: State,
  formData: FormData
): Promise<State> => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      logEvent("Unauthorized ticket creation attempt", "ticket", {}, "warning");
      return {
        success: false,
        message: "You must be logged in to create a ticket",
      };
    }

    const subject = formData.get("subject") as string;
    const desc = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    if (!subject || !desc || !priority) {
      logEvent(
        "Validation Error: Missing ticket fields",
        "ticket",
        {subject, desc, priority},
        "warning"
      );
      return {success: false, message: "All fields are required"};
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description: desc,
        priority,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    logEvent(
      `Ticket created successfully: ${ticket.id}`,
      "ticket",
      {ticketId: ticket.id},
      "info"
    );

    revalidatePath("/tickets");

    return {
      success: true,
      message: "Ticket created successfully",
    };
  } catch (error) {
    console.log("formData.entries(): ", formData.entries());
    logEvent(
      "Error creating ticket",
      "ticket",
      {formData: Object.fromEntries(formData.entries())},
      "error"
    );

    return {
      success: false,
      message: "Error creating ticket",
    };
  }
};

export const getTickets = async () => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      logEvent(
        "Unauthorized ticket retrieval attempt",
        "ticket",
        {},
        "warning"
      );
      return [];
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    logEvent(
      `Tickets retrieved successfully for user: ${user.id}`,
      "ticket",
      {userId: user.id, ticketsCount: tickets.length},
      "info"
    );

    return tickets;
  } catch (err) {
    logEvent("Error retrieving tickets", "ticket", {}, "error", err);

    return [];
  }
};

export const getTicketById = async (id: string) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!ticket) {
      logEvent(`Ticket not found: ${id}`, "ticket", {ticketId: id}, "warning");

      return null;
    }

    logEvent(
      `Ticket retrieved successfully: ${id}`,
      "ticket",
      {ticketId: id},
      "info"
    );

    return ticket;
  } catch (err) {
    logEvent("Error retrieving ticket", "ticket", {}, "error", err);
    return null;
  }
};

export const closeTicket = async (prevState: State, formData: FormData) => {
  const ticketId = Number(formData.get("ticketId"));

  if (!ticketId) {
    logEvent(
      "Validation Error: Missing ticket ID",
      "ticket",
      {ticketId},
      "warning"
    );
    return {
      success: false,
      message: "Ticket ID is required",
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    logEvent("Unauthorized ticket closure attempt", "ticket", {}, "warning");
    return {
      success: false,
      message: "You must be logged in to close a ticket",
    };
  }

  const ticket = await prisma.ticket.findUnique({
    where: {
      id: ticketId,
    },
  });

  if (!ticket || ticket.userId !== user.id) {
    logEvent(
      `Ticket not found: ${ticketId}`,
      "ticket",
      {ticketId, userId: user.id},
      "warning"
    );
    return {
      success: false,
      message: "Ticket not found",
    };
  }

  await prisma.ticket.update({
    where: {
      id: ticketId,
    },
    data: {
      status: "Closed",
    },
  });

  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);

  logEvent(
    `Ticket closed successfully: ${ticketId}`,
    "ticket",
    {ticketId},
    "info"
  );

  return {
    success: true,
    message: "Ticket closed successfully",
  };
};
