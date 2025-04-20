import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(request: NextApiRequest, response: NextApiResponse) {
  try {
    console.log({ request });

    return response.status(200).json({ message: "Data received", data: request.body });
  } catch (e) {
    console.log({ e });
  }

  return NextResponse.json({ message: "success" });
}
