export type LoginInputDto = {
  email?: string;
  password?: string;
};

export type LoginOutputDto = {
  authenticated: boolean;
  message: string;
  cookieCount: number;
};
