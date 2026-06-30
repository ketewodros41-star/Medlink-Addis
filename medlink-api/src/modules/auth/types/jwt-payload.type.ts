export type JwtPayload = {
  sub: string;
  hospital_id: string;
  roles: string[];
  permissions: string[];
  session_id: string;
  device_id: string;
};
