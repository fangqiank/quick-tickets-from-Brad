"use server";

import {prisma} from "@/db/prisma";
import {
  deleteAuthCookie,
  getAuthCookie,
  setAuthCookie,
  signAuthToken,
  verifyAccessToken,
} from "@/lib/auth";
import {logEvent} from "@/utils/sentry";
import bcrypt from "bcryptjs";
import {log} from "console";

type State = {
  success: boolean;
  message: string;
};

export const registerUser = async (
  prevState: State,
  formData: FormData
): Promise<State> => {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      logEvent(
        "Validation Error: Missing registration fields",
        "auth",
        {name, email},
        "warning"
      );
      return {success: false, message: "All fields are required"};
    }

    const existedUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existedUser) {
      logEvent(
        "Validation Error: User already exists",
        "auth",
        {email},
        "warning"
      );
      return {success: false, message: "User already exists"};
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const token = await signAuthToken({
      userId: user.id,
    });
    await setAuthCookie(token);

    logEvent(
      `User registered successfully: ${email}`,
      "auth",
      {userId: user.id, email},
      "info"
    );

    return {
      success: true,
      message: "User registered successfully",
    };
  } catch (error) {
    logEvent("Error registering user", "auth", {error}, "error");
    return {
      success: false,
      message: "Error registering user",
    };
  }
};

type authPayload = {
  userId: string;
};

export const getCurrentUser = async () => {
  try {
    const token = await getAuthCookie();

    if (!token) return null;

    const payload = (await verifyAccessToken(token)) as authPayload;

    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  } catch (error) {
    logEvent("Error getting current user", "auth", {error}, "error");
    return null;
  }
};

export const loginUser = async (
  prevState: State,
  formData: FormData
): Promise<State> => {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      logEvent(
        "Validation Error: Missing login fields",
        "auth",
        {email},
        "warning"
      );
      return {success: false, message: "All fields are required"};
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      logEvent("Validation Error: User not found", "auth", {email}, "warning");
      return {success: false, message: "Invalid credentials"};
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      logEvent(
        "Validation Error: Invalid password",
        "auth",
        {email},
        "warning"
      );
      return {success: false, message: "Invalid credentials"};
    }

    const token = await signAuthToken({
      userId: user.id,
    });
    await setAuthCookie(token);

    logEvent(
      `User logged in successfully: ${email}`,
      "auth",
      {userId: user.id, email},
      "info"
    );

    return {
      success: true,
      message: "User logged in successfully",
    };
  } catch (error) {
    logEvent("Error logging in user", "auth", {error}, "error");
    return {
      success: false,
      message: "Error logging in user",
    };
  }
};

export const logoutUser = async (): Promise<State> => {
  try {
    await deleteAuthCookie();

    logEvent("User logged out successfully", "auth", {}, "info");

    return {
      success: true,
      message: "User logged out successfully",
    };
  } catch (err) {
    logEvent("Error logging out user", "auth", {error: err}, "error");

    return {
      success: false,
      message: "Error logging out user",
    };
  }
};
