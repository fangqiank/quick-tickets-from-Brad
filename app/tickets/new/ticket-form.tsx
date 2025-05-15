'use client'

import { createTicket } from "@/actions/ticket.action"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

export const NewTicketForm = () => {
	const [state, formAction] = useActionState(createTicket, {
		success: false,
		message: ''
	})

	const router = useRouter()

	useEffect(() => {
		if(state.success) {
			toast.success('Ticket created successfully')
			router.push('/tickets')
		}
	}, [state.success, router])

	return (
		<div className="w-full max-w-md bg-white shadow-md rounded-lg p-8 border border-gray-200">
			<h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
				创建新支持票
			</h1>
			{state.message && !state.success && (
				<p className="text-red-500 mb-4 text-center">{state.message}</p>
			)}
			<form
				className="space-y-4 text-gray-700"
				action={formAction}
			>
				<input 
					type="text"
					className='w-full border border-gray-200 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400' 
					name="subject"
					placeholder="主题"
				/>

				<textarea
					className="w-full border border-gray-200 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" 
					name="description" 
					placeholder="描述你的问题"
					rows={4}
				/>

				<select 
					className="w-full border border-gray-200 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
					name="priority" 
					defaultValue="Low"
				>
					<option value="Low">Low Priority</option>
					<option value='Medium'>Medium Priority</option>
          <option value='High'>High Priority</option>
				</select>

				<button
					className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
					type="submit"
				>
					Submit
				</button>
			</form>
		</div>
	)
}