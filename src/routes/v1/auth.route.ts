import { Router } from "express";
import AuthController, { contactAdmin, updateWallet } from "../../controllers/auth.controller";
import { authenticateJWT} from "../../middlewares/auth.middleware";
// import authController from "../../controllers/auth.controller";


const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.send("Hit auth route");
});

authRouter.post("/register-publisher", AuthController.register);
authRouter.post("/register-user", AuthController.registerUser);
authRouter.post("/verify-otp", AuthController.verifyOtp);
authRouter.post("/login", AuthController.login);
authRouter.get("/get-profile",authenticateJWT,AuthController.getProfile);
authRouter.put("/update-profile",authenticateJWT, AuthController.updateProfile);
authRouter.post("/resend-otp",AuthController.resendOtp);
authRouter.post("/forget-password",AuthController.forgetPassword);
authRouter.post("/reset-password",AuthController.resetPasswords);
authRouter.post("/contact-user",AuthController.contactUsers);
authRouter.put("/update-wallet",authenticateJWT, updateWallet);
authRouter.put("/update-password", authenticateJWT,AuthController.updatePassword);
authRouter.get("/get-token-status", authenticateJWT, (req, res) => {
  return res.status(200).json({
    message: "Token is valid",
    
  });
});

authRouter.post('/contact-admin',contactAdmin)
export default authRouter;
