const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// @route   GET /api/uploads
// @desc    Get all import history for the user
const getUploads = async (req, res) => {
  try {
    const uploads = await prisma.upload.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    });

    res.json(uploads);
  } catch (error) {
    console.error("Get Uploads Error:", error);
    res.status(500).json({ message: "Server error fetching upload history" });
  }
};

// @route   DELETE /api/uploads/:id
// @desc    Delete an import and all its associated transactions
const deleteUpload = async (req, res) => {
  const { id } = req.params;

  try {
    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return res.status(404).json({ message: "Upload record not found" });
    }

    if (upload.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this record" });
    }

    // Deleting the upload will cascade and delete all related transactions due to onDelete: Cascade in Prisma
    await prisma.upload.delete({
      where: { id }
    });

    res.json({ message: "Upload history and all associated transactions deleted permanently." });
  } catch (error) {
    console.error("Delete Upload Error:", error);
    res.status(500).json({ message: "Server error deleting upload record" });
  }
};

module.exports = { getUploads, deleteUpload };
