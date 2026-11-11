import type { Response } from "express";

const errorResponse = (res: Response) => {
  return res.status(500).json({
    msg: "Internal server error",
  });
};

export default errorResponse;
