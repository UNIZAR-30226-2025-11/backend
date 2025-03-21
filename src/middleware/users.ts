import { Request, Response, NextFunction } from "express";

export function filterNonModifiableUserData(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const modifiableKeys = ["username", "password"];

	req.body = Object.fromEntries(
		Object.entries(req.body).filter(([key]) => modifiableKeys.includes(key)),
	);

	next();
}
