import { Request, Response } from "express";
import { getPublishers } from "../services/moderator.service";


const fetchPublishers = async (req: Request, res: Response) => {
    try {
        const publishers = await getPublishers();
        return res.status(200).json({ success: true, data: publishers });
    } catch (error) {
        console.error("Error fetching publishers:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch publishers" });
    }
};

export default {fetchPublishers};
