import axios, { AxiosInstance } from "axios";

const APIBASEURL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const apiAgent: AxiosInstance = axios.create({
	baseURL: APIBASEURL
});

const endpoint = {
	signup: (email: string, password: string) => apiAgent.post('/register', {
		email: email,
		password: password
	}), 
	signin: (email: string, password: string) => apiAgent.post('/login', {
		email: email,
		password: password
	}),
}

export { endpoint }
