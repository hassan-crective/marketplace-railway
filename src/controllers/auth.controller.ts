import { NextFunction, Request, Response } from "express";
import { AuthInputSchema, LoginInputSchema, VerifyOTPSchema,UserAuthInputSchema,AuthUpdateInputSchema, PasswordInputSchema, updateWalletValidator } from "../validators/auth.validation";
import AuthService, { forgotPassword, resetPassword, contactUser, updateWalletService , updateUserPassword, sendContactEmail  } from "../services/auth.service";


const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("register called", { body: req.body }, "AuthController");

    const validatedInput = AuthInputSchema.parse(req.body);

    const response = await AuthService.register(validatedInput);

    res.status(201).json(response);
  } catch (error) {
    console.error("Error in register", { error, body: req.body }, "AuthController");

    next(error);
  }
};

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("register user called", { body: req.body }, "AuthController");

    // Validate the input using the schema
    const validatedInput = UserAuthInputSchema.parse(req.body);

    // Call the AuthService to register the user
    const response = await AuthService.registeruser(validatedInput);

    // Respond with a success message and data
    res.status(200).json({
      message: "User registered successfully!",
      data: response,
    });
  } catch (error) {
    console.error("Error in register", { error, body: req.body }, "AuthController");

    // Pass the error to the next middleware
    next(error);
  }
};

const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("verifyOtp called", { body: req.body }, "AuthController");

    const validatedInput = VerifyOTPSchema.parse(req.body);

    const response = await AuthService.verifyOtp(validatedInput);

    res.status(201).json(response);
  } catch (error) {
    console.error("Error in register", { error, body: req.body }, "AuthController");

    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("login called", { body: req.body }, "AuthController");

    const validatedInput = LoginInputSchema.parse(req.body);
    const response = await AuthService.login(validatedInput);

    res.status(200).json({
      message: "Login Successfully",
      ...response,
    });
  } catch (error) {
    console.error("Error in login", { error, body: req.body }, "AuthController");

    next(error);
  }
};

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("get profile called", { body: req.body }, "AuthController");
    const userId = req.user?.userId ;
    console.log(userId);
    const response = await AuthService.getProfile(userId);

    res.status(200).json(response); // Use 200 for success (GET requests typically use 200)
  } catch (error) {
    console.error("Error in getting Profile", { error, body: req.body }, "AuthController");

    next(error);
  }
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("update profile called", { body: req.body }, "AuthController");
    console.log("requested user", req.user);
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const validatedData = AuthUpdateInputSchema.parse(req.body);

    

    const updatedUser = await AuthService.updateProfile(userId, validatedData);

    res.status(200).json({
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateProfile", { error, body: req.body }, "AuthController");
    next(error);
  }
};

const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    console.log(email);
    const response = await AuthService.resendOtp(email);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in resend OTP controller", { error, body: req.body }, "AuthController");
    next(error);
  }
};

const forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, lan } = req.body;
    const response = await forgotPassword(email,lan);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const resetPasswords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, newPassword } = req.body;
    const { password } = PasswordInputSchema.parse({ password: newPassword });
    const response = await resetPassword(email, token, password);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const contactUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const response = await contactUser(email);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// add walletAddress and currency
export const updateWallet = async (req: Request, res: Response) => {
  try {
    const validatedData = updateWalletValidator.parse(req.body);

    const userId = req.user?.userId; 
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const updatedUser = await updateWalletService(userId, validatedData);

    return res.json({ message: "Wallet updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error:", error);
    return res.status(400).json({ message: "walletAddress  or currency missing", error });
  }
};

// update passwords
// const updatePassword = async (req: Request, res: Response) => {
//   try {
//     const userId = req.user?.userId; 
//     const { currentPassword, newPassword } = req.body;
//     console.log(currentPassword)
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: "Both current and new passwords are required." });
//     }

//     const result = await updateUserPassword(userId, currentPassword, newPassword);

//     if (result.success) {
//       return res.status(200).json({ message: "Password updated successfully." });
//     } else {
//       return res.status(400).json({ message: result.message });
//     }
//   } catch (error) {
//     return res.status(500).json({ message: "Internal server error", error });
//   }
// };
const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId; 
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current and new passwords are required." });
    }

    // Validate newPassword with Zod schema
    const validationResult = PasswordInputSchema.safeParse({ password: newPassword });
    if (!validationResult.success) {
      return res.status(400).json({ message: validationResult.error.errors[0].message });
    }

    const result = await updateUserPassword(userId, currentPassword, newPassword);

    if (result.success) {
      return res.status(200).json({ message: "Password updated successfully." });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
};

export const contactAdmin = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  // Validate form fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Delegate to service
    await sendContactEmail(name, email, subject, message);

    res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

export default {
  register,
  login,
  verifyOtp,
  registerUser,
  getProfile,
  updateProfile,
  resendOtp,
  forgetPassword,
  resetPasswords,
  contactUsers,
  updatePassword,
  
}


