import axios from 'axios';

export const api = axios.create({
  // baseURL: 'http://localhost:8080/api', // <--- Antigo (Comente ou apague)
  baseURL: 'https://vs-diesel-backend.vercel.app/api', // <--- NOVO (Use o SEU link da Vercel)
});