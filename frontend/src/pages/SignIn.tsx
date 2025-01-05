import { useState } from 'react';
import { Button, Col, Row, notification, Input, Typography } from 'antd';
import { endpoint } from '../utils/apiAgent';

const { Title, Text, Link } = Typography;
type NotificationType = 'success' | 'error';

export default function SignIn() {
	const [api, notificationHolder] = notification.useNotification();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [emailWarning, setEmailWarning] = useState<boolean>(false);
	const [passwordWarning, setPasswordWarning] = useState<boolean>(false);
	const [signInWarning, setSignInWarning] = useState<boolean>(false);

	const openNotificationWithIcon = (type: NotificationType) => {
		let messageTitle = '';
		let messageDescription = '';
		switch (type) {
			case 'success':
				messageTitle = '成功';
				messageDescription = 'ログインが成功しました。';
				break;
			case 'error':
				messageTitle = '失敗';
				messageDescription = 'ログインに失敗しました。';
				break;
			default:
				messageTitle = '失敗';
				messageDescription = 'ログインに失敗しました。';
				break;
		}
		api[type]({
			message: messageTitle,
			description: messageDescription,
		});
	};

	const handleSignIn = async () => {
		setSignInWarning(false);
		if (!email) {
			setEmailWarning(true);
			return;
		}
		if (!password) {
			setPasswordWarning(true);
			return;
		}

		await endpoint.signin(email, password).then((response) => {
			const data: UserLoginData = response.data.detail;
			openNotificationWithIcon('success');
			localStorage.setItem('token', data.token);
			setTimeout(() => {
				window.location.href='/dashboard';	
			}, 1 * 1000);
		}).catch((e) => {
			setSignInWarning(true);
			console.error(e);
		});
	};

	return (
		<>
			<Row justify={'center'} align={'middle'} className='h-screen bg-SignBg bg-cover bg-no-repeat bg-left'>
				<Col className='max-w-[650px] w-11/12'>
					<Title className='!text-main'>MLMシステムへようこそ</Title>
					<Col className='mt-[10px]'>
						<Text className='font-bold text-main'>
							メール
						</Text>
						<Input
							placeholder='メール'
							className='py-[10px] mt-[5px]'
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setEmailWarning(false);
							}}
						/>
					</Col>
					{emailWarning && (
						<Col className='font-bold text-warning mt-[5px]'>
							メールアドレスの形式で入力してください。
						</Col>
					)}
					<Col className='mt-[30px]'>
						<Text className='font-bold text-main'>
							パスワード
						</Text>
						<Input.Password
							placeholder='パスワード'
							className='py-[10px] mt-[5px]'
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setPasswordWarning(false);
							}}
						/>
					</Col>
					{passwordWarning && (
						<Col className='font-bold text-warning mt-[5px]'>
							パスワードを入力してください。
						</Col>
					)}
					{signInWarning && (
						<Col className='font-bold text-warning mt-[5px]'>
							入力された情報に誤りがあります。
						</Col>
					)}
					<Row justify={'end'} align={'middle'} gutter={10} className='mt-[5px]'>
						<Col>
							<Text className='text-[12px]'>
								アカウントをお持ちではありませんか?
							</Text>
						</Col>
						<Col>
							<Link underline href='/signup' className='!text-main text-[12px]'>
								こちらから登録
							</Link>
						</Col>
					</Row>
					<Col className='mt-[30px]'>
						<Button
							block
							className='font-bold bg-main text-[16px] text-white'
							style={{ height: '50px' }}
							onClick={handleSignIn}
						>
							ログイン
						</Button>
					</Col>
				</Col>
			</Row>
			{notificationHolder}
		</>
	);
};