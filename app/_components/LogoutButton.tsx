'use client'

import { logoutUser } from "@/actions/auth.action"
import { useActionState, useEffect } from "react"
import { toast } from "sonner"

export const LogoutButton = () => {
	const initState = {
		success: false,
		message: ''
	}

	const [state, formAction] = useActionState(logoutUser ,initState)

	useEffect(() => {
		if (state.success) {
      toast.success('Logout successful');
    } else if (state.message) {
      toast.error(state.message);
    }
	}, [state])

	return (
		<form action={formAction}>
      <button
        type='submit'
        className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition'
      >
        Logout
      </button>
    </form>
	)
}