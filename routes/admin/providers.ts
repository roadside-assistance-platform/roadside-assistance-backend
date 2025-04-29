import { Router } from "express";
import prisma from "../../app";
import { isAdmin } from "../../middleware/auth";

const router = Router();

// PATCH /admin/providers/:id/approve - Approve a provider
import { Request, Response } from "express";

router.patch("/:id/approve", isAdmin, async (req: Request, res: Response): Promise<void> => {
  const providerId = req.params.id;
  try {
    const provider = await prisma.provider.update({
      where: { id: providerId },
      data: { isApproved: true },
    });
    res.status(200).json({
      status: "success",
      message: "Provider approved successfully",
      data: { provider },
    });
  } catch (error: unknown) {
    let errMsg = "Unknown error";
    if (error instanceof Error) errMsg = error.message;
    res.status(404).json({
      status: "error",
      message: "Provider not found or could not be approved",
      error: errMsg,
    });
  }
});

export default router;
