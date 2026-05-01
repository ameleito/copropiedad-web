export interface Pet {
  id: string;
  unitNumber: string;
  ownerName: string;
  name: string;
  species: string;
  breed: string | null;
  color: string | null;
  photoUrl: string | null;
  vaccineCertUrl: string | null;
  active: boolean;
  registeredAt: string;
}
