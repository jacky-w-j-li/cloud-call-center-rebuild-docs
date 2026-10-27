package com.koala.smart.test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;

public class Client {
	
	public static void main(String[] args){
		StringBuffer buffer = new StringBuffer();
		long time = 0;
		try {
			Socket socket = new Socket();
			socket.connect(new InetSocketAddress("127.0.0.1", 6789), 10000);
//			socket.getOutputStream().write("command1\r\n".getBytes("UTF-8"));
			socket.getOutputStream().write("hello12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890\r\n"
												.getBytes("UTF-8"));
			socket.getOutputStream().flush();
			byte[] data = new byte[1024];
			int count = 0;
			long b = 0;
			while((count = socket.getInputStream().read(data)) != -1){
				if(b != 0){
					long c = System.currentTimeMillis() - b;
					if(c > time)
						time = c;
				}
				String  command = new String(data, 0, count, "UTF-8");
				if(command.indexOf("\r\n")!=-1){
					String a = buffer.toString();
					buffer.delete(0, buffer.length());
					String[] commands = command.split("\r\n");
					if(commands.length > 0)
					for(int i=0;i<commands.length;i++){
						command = a+commands[i];
						System.out.println("Get - "+command+" - "+time);
						if(command.equalsIgnoreCase("command1")){
							socket.getOutputStream().write("command2\r\n".getBytes("UTF-8"));
							socket.getOutputStream().flush();
							System.out.println("send - command2");
							b = System.currentTimeMillis();
						} else if(command.equalsIgnoreCase("command2")){
							socket.getOutputStream().write("command1\r\n".getBytes("UTF-8"));
							socket.getOutputStream().flush();
							System.out.println("send - command1");
							b = System.currentTimeMillis();
						}
						a = "";
					}
					else buffer.append(command);
				}
				else {
					buffer.append(command);
				}
			}
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
