export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  buildingId: string;
  unitId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  idDocument?: string;
  role: string;
  buildingId: string;
  buildingName: string;
  unitId?: string;
  unitNumber?: string;
  whatsappOptIn: boolean;
  pushOptIn: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  idDocument?: string;
  whatsappOptIn?: boolean;
  pushOptIn?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  fcmToken?: string;
}
