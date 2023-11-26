import axios from "axios";

declare const client: {
  fetchV1Id: (config?: axios.AxiosRequestConfig) => Promise<IFormattedNotification>;
  replaceV1Seen: (config?: axios.AxiosRequestConfig) => Promise<{ collection: INotificationsCollection; notifications: IFormattedNotification[]; }>;
  createInternalMigrationsIdStart: (config?: axios.AxiosRequestConfig) => Promise<string>;
};

export default client;