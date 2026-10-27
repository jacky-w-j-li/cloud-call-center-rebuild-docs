package com.koala.smart.test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.UnknownHostException;

public class TestWriteClient {
	public static void main(String[] args){
		try {
			Socket socket = new Socket();
			socket.connect(new InetSocketAddress("127.0.0.1", 9090), 10000);
			byte[] data = new byte[1024];
			while(socket.getInputStream().read(data) != -1){
				for(int i=0;i<1024;i++){
					System.out.println(data[i]);
					data[i] = 0;
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
