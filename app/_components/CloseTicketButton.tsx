'use client'

import { closeTicket } from "@/actions/ticket.action"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

type Props = {
	ticketId: number,
	isClosed: boolean
}

export const CloseTicketButton = (props: Props) => {
	const initState = {
		success: false,
		message: ''
	}

	const [state, formAction] = useActionState(closeTicket ,initState)

	useEffect(() => {
		if (state.success) {
			toast.success(state.message)
		}else if (state.message && !state.success) {
			toast.error(state.message)
		}
	}, [state])

	if(props.isClosed)
		return null

	return (
		<form action={formAction}>
			<input 
				type="hidden"
				name="ticketId"
				value={props.ticketId} 
			/>

			<button
				type="submit"
				className="inline-block bg-red-600 text-white px-6 py-3 rounded shadow hover:bg-red-700 transition"
			>
				Close Ticket
			</button>
		</form>
	)
}