import bcrypt from "bcrypt";
import { DeepPartial } from "typeorm";
import { User } from "../models/user";
import { AuthInput, UserAuthInput, VerifyOTPInput } from "../validators/auth.validation";
import { UserRepository } from "../repositories/index";
import { BadRequestError } from "../errors/badRequest.error";
import { ForbiddenError } from "../errors/forbidden.error";
import { NotFoundError } from "../errors/notFound.error";
import { generateOTP } from "../utils/generateOTP";
import { generateReferralCode } from "../utils/generateReffralCode";
import * as crypto from "crypto";
import { sendEmail } from "../utils/emails";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
async function register(registerInput: AuthInput) {
  try {
    console.log("Register function called", { registerInput }, "AuthService");
    // Check if a user with the same email or phone number already exists
    const existingUser = await UserRepository.findOne({
      where: [{ email: registerInput.email }, { phoneNo: registerInput.phoneNumber }],
    });
    if (existingUser) {
      throw new BadRequestError("User with this email or phone number already exists");
    }
    // Generate OTP and referral code
    const otp = generateOTP(6);
    const otpExpiresAt: Date = new Date(Date.now() + 10 * 60 * 1000);
    const referralCode = generateReferralCode();
    // Map input fields to the User entity
    const newUser = UserRepository.create({
      ...registerInput,
      password: await bcrypt.hash(registerInput.password, 10), // Hash password
      role: "publisher",
      referralCode,
      otp,
      otpExpiresAt,
      phoneNo: registerInput.phoneNumber,
      numberOfSites: registerInput.numberOfSites || 0,
      ownsSite: registerInput.ownsSite || false,
      hasDoFollowLinks: registerInput.hasDoFollowLinks || false,
      sellingArticles: registerInput.sellingArticles || false,
      isAffiliateRequested: false,
      isAffiliate: false,
      isApproved: false,
    } as DeepPartial<User>);

    const savedUser = await UserRepository.save(newUser);
    if (!savedUser) {
      throw new BadRequestError("Failed to create the user");
    }
    console.log("Attempting to send email to:", registerInput.email);
    // Use Nodemailer instead of SendGrid
    await sendEmail({
      from: process.env.NO_REPLY_EMAIL,
      toEmail: registerInput.email,
      subject: "Successful Registration",
      text: `You have registered successfully. Your OTP for verification is ${otp}.`,
    });
    console.log("✅ Email function executed successfully.");
    // console.log("New user registered successfully", { savedUser }, "AuthService");
    return { data: savedUser };
  } catch (error) {
    // console.error("❌ Error in register function", { error, registerInput }, "AuthService");
    throw error;
  }
}
async function verifyOtp(otpInput: VerifyOTPInput) {
  try {
    console.log("OTP verification started");
    const otp = otpInput.otp.toString();
    // Fetch user by identifier (email or phone number)
    const user = await UserRepository.findOne({
      where: [{ email: otpInput.email }],
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // Check if OTP matches and is not expired
    if (user.otp !== otp) {
      throw new BadRequestError("Invalid OTP");
    }
    // Check if OTP has expired (ensure otpExpiresAt is not null)
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw new BadRequestError("OTP has expired");
    }
    // Update isVerified to true
    user.isVerified = true;
    user.otp = null; // Clear OTP after verification
    user.otpExpiresAt = null; // Clear the OTP expiry date
    const updatedUser = await UserRepository.save(user);
    // Use Nodemailer instead of SendGrid
    await sendEmail({
      from: process.env.NO_REPLY_EMAIL,
      toEmail: otpInput.email,
      subject: "Account Verification",
      text: `Your OTP for verification is ${otp}. Verify Your Account`,
    });
    console.log("OTP verified successfully", { updatedUser });
    return { message: "OTP verified successfully", data: updatedUser };
  } catch (error) {
    console.error("Error in OTP verification", { error });
    throw error; // Re-throw the error for the caller to handle
  }
}
async function login(loginInput: { email: string; password: string }) {
  try {
    console.log("Login function called", { loginInput }, "AuthService");
    // Check if the user exists by email
    const user = await UserRepository.findOne({
      where: { email: loginInput.email },
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (!user.isVerified) {
      throw new BadRequestError("User is not verified yet");
    }
    if (!user.isApproved) {
      throw new ForbiddenError("User is not approved yet");
    }
    // Verify the password using bcrypt
    const isPasswordValid = await bcrypt.compare(loginInput.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid email or password");
    }
    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, permissions: user.permissions }, // Payload
      process.env.JWT_SECRET as string, // Secret key from environment variables
      { expiresIn: "24h" } // Token expiration time
    );
    // Return token and user data (exclude sensitive information like password)
    const { password, ...userData } = user; // Remove password from response
    return { token, data: userData };
  } catch (error) {
    console.error("Error in login function", { error, loginInput }, "AuthService");
    throw error; // Re-throw the error to be handled by the caller
  }
}
async function registeruser(registerInput: UserAuthInput) {
  try {
    console.log("Register function called", { registerInput }, "AuthService");
    // Check if a user with the same email or phone number already exists
    const existingUser = await UserRepository.findOne({
      where: [{ email: registerInput.email }, { phoneNo: registerInput.phoneNumber }],
    });
    if (existingUser) {
      throw new BadRequestError("User with this email or phone number already exists");
    }
    // Check if a user with the same referral code exist
    const otp = generateOTP(6);
    const otpExpiresAt: Date = new Date(Date.now() + 10 * 60 * 1000);
    const referralCode = generateReferralCode();
    // Map input fields to the User entity
    const newUser = UserRepository.create({
      ...registerInput,
      password: await bcrypt.hash(registerInput.password, 10), // Hash password
      role: "user",
      referralCode,
      otp,
      otpExpiresAt,
      isAffiliateRequested: false,
      isAffiliate: false,
      isApproved: true,
      phoneNo: registerInput.phoneNumber,
    } as DeepPartial<User>);

    await sendEmail({
      from: process.env.NO_REPLY_EMAIL,
      toEmail: registerInput.email,
      subject: "Successfully Registration",
      text: `You have registered successfully. Your OTP for verification is ${otp}.`,
    });
    const savedUser = await UserRepository.save(newUser);

    if (!savedUser) {
      throw new BadRequestError("Failed to create the user");
    }
    console.log("New user registered successfully", { savedUser }, "AuthService");
    return { data: savedUser };
  } catch (error) {
    console.error("Error in register function", { error, registerInput }, "AuthService");
    throw error; // Re-throw the error to be handled by the caller
  }
}
async function getProfile(userId: string | number) {
  try {
    console.log("Get profile function called", { userId }, "AuthService");
    // Ensure the ID is a string
    const userIdString = typeof userId === "number" ? userId.toString() : userId;
    // Find the user by ID
    const user = await UserRepository.findOne({ where: { id: userIdString } });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // Exclude sensitive information like the password
    const { password, ...userData } = user;
    return userData;
  } catch (error) {
    console.error("Error in get profile function", { error, userId }, "AuthService");
    throw error;
  }
}
async function updateProfile(
  userId: string,
  updateInput: {
    firstName?: string;
    lastName?: string;
    email?: string;
    country?: string;
  }
) {
  try {
    console.log("Update profile function called", { userId, updateInput }, "AuthService");
    // Find the user by ID
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    console.log("Fetched user:", user);
    // Check if email is being updated
    if (updateInput.email) {
      const existingUser = await UserRepository.findOne({ where: { email: updateInput.email } });
      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestError("Email is already taken by another user");
      }
    }
    // Update basic profile fields
    user.firstName = updateInput.firstName ?? user.firstName;
    user.email = updateInput.email ?? user.email;
    user.lastName = updateInput.lastName ?? user.lastName;
    user.country = updateInput.country ?? user.country;

    // Save the updated user
    await UserRepository.save(user);
    return { message: "Profile updated successfully" };
  } catch (error) {
    console.error("Error in update profile function", { error, userId, updateInput }, "AuthService");
    throw error;
  }
}
async function resendOtp(emails: string) {
  try {
    console.log("Resend OTP function called", { emails }, "AuthService");
    // Find user by email
    const user = await UserRepository.findOne({
      where: [{ email: emails }],
    });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    // Generate a new OTP and expiration time
    const newOtp = generateOTP(6);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    // Update the user's OTP and expiration time
    user.otp = newOtp.toString();
    user.otpExpiresAt = otpExpiresAt;
    await UserRepository.save(user);
    // Use Nodemailer instead of SendGrid
    await sendEmail({
      from: process.env.NO_REPLY_EMAIL,
      toEmail: user.email,
      subject: "Your OTP Code",
      text: `Your New OTP ${newOtp} `,
    });
    return { message: "OTP resent successfully" };
  } catch (error) {
    console.error("Error in resend OTP function", { error, emails }, "AuthService");
    throw error; // Re-throw the error to be handled by the caller
  }
}
export const forgotPassword = async (email: string, lan: string) => {
  const baseUrl = process.env.FORGET_PASSWORD_URL;
  try {
    console.log("Forgot Password function called", { email, lan });
    const user = await UserRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await UserRepository.save(user);
    // Step 4: Send the email with the reset link
    const resetLink = `${baseUrl}/${lan}/reset-password?token=${resetToken}&email=${email}`;
    // Use Nodemailer instead of SendGrid
    await sendEmail({
      from: process.env.NO_REPLY_EMAIL,
      toEmail: user.email,
      subject: "Forget Password !",
      text: `Click on this link to reset your password ${resetLink}  `,
    });

    return { message: "Password reset email sent" };
  } catch (error) {
    console.error("Error in forgotPassword function", { error, email });
    throw error;
  }
};
export const resetPassword = async (email: string, token: string, newPassword: string) => {
  try {
    console.log("Reset Password function called", { email });
    // Step 1: Find the user by email
    const user = await UserRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundError("User with the specified email does not exist.");
    }
    // Step 2: Validate the token and its expiration
    if (!user.resetPasswordToken || !user.resetPasswordExpiresAt) {
      throw new BadRequestError("No valid reset token found for this user.");
    }
    const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
    if (!isValidToken) {
      throw new BadRequestError("Invalid reset token.");
    }
    if (user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestError("Reset token has expired.");
    }
    // Step 3: Hash the new password and clear reset fields
    user.password = await bcrypt.hash(newPassword, 10); // Securely hash the new password
    user.resetPasswordToken = undefined; // Clear the token
    user.resetPasswordExpiresAt = undefined; // Clear the expiration
    await UserRepository.save(user);
    console.log("Password reset successful for user", { email });
    return { message: "Password reset successful." };
  } catch (error) {
    console.error("Error in resetPassword function", { error, email });
    throw error;
  }
};
export const contactUser = async (userEmail: string) => {
  try {
    console.log("Contact User function called", { userEmail }, "ContactService");
    // Validate input
    if (!userEmail) {
      throw new Error("User email is required");
    }
    // Define the system and user email messages
    const systemSubject = "User Contact Request";
    const systemMessage = `User with email ${userEmail} wants to contact you.`;
    const userSubject = "Contact Request Received";
    const userMessage = `
      Thank you for reaching out to us. We have received your request, and one of our representatives will get in touch with you soon.`;

    // Send confirmation email to the user
    await sendEmail({
      toEmail: userEmail, // User's email address
      subject: userSubject,
      text: userMessage,
    }); 
    return { message: "Emails sent successfully" };
  } catch (error) {
    console.error("Error in Contact User function", { error, userEmail }, "ContactService");
    throw error; // Re-throw the error to be handled by the caller
  }
};
// add walletaddress and currency
export const updateWalletService = async (userId: string, data: { walletAddress: string; currency: string }) => {
  const user = await UserRepository.findOne({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  user.walletAddress = data.walletAddress;
  user.currency = data.currency;
  await UserRepository.save(user);
  return user;
};
// update password
export const updateUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserRepository.findOne({ where: { id: userId } });

  if (!user) {
    return { success: false, message: "User not found." };
  }
  console.log("Stored hashed password:", user.password);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  console.log("Password match result:", isMatch);
  if (!isMatch) {
    return { success: false, message: "Current password is incorrect." };
  }
  const salt = await bcrypt.genSalt(10);
  const newHashedPassword = await bcrypt.hash(newPassword, salt);
  console.log("New hashed password:", newHashedPassword);
  user.password = newHashedPassword;

  const updatedUser = await UserRepository.save(user);
  console.log("Updated user in DB:", updatedUser);
  return { success: true };
};
export default {
  register,
  login,
  verifyOtp,
  registeruser,
  updateProfile,
  getProfile,
  resendOtp,
  forgotPassword,
  resetPassword,
  contactUser,
  updateUserPassword,
};

export const sendContactEmail = async (name: string, userEmail: string, subject: string, message: string) => {
  const adminEmail = process.env.ADMIN_EMAIL as string;
  console.log(adminEmail);
  // Construct the message with HTML formatting
  const formattedMessage = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${userEmail}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  // Use Nodemailer instead of SendGrid
  await sendEmail({
    toEmail: adminEmail,
    subject: subject,
    text: formattedMessage,
  });

  return { message: "Contact email sent successfully" };
};


