package com.koala.smart.test;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetSocketAddress;
import java.net.SocketException;

public class UDPClient {
	public static void main(String[] args) {
		try {
			StringBuffer buffer = new StringBuffer();
			long time = 0;
			long b = 0;
			DatagramSocket socket = new DatagramSocket();
			// socket.connect(new InetSocketAddress("127.0.0.1", 6789));
			DatagramPacket p = new DatagramPacket(new byte[512], 512);
			byte[] d;
			try {
				d = "command1\r\n".getBytes("UTF-8");
				socket.send(new DatagramPacket(d, d.length,
						new InetSocketAddress("127.0.0.1", 6789)));
			} catch (UnsupportedEncodingException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}

			while (true) {
				try {
					socket.receive(p);
					if(b != 0){
						long c = System.currentTimeMillis() - b;
						if(c > time)
							time = c;
					}
					String command = new String(p.getData(), 0, p.getLength(),
					"UTF-8");
					if(command.indexOf("\r\n")!=-1){
						String a = buffer.toString();
						buffer.delete(0, buffer.length());
						buffer.append(command.substring(command.indexOf("\r\n")+2));
						command = a+command.substring(0, command.indexOf("\r\n"));
						System.out.println("Get - "+command+" - "+time);
						// try {
						// Thread.sleep(500);
						// } catch (InterruptedException e) {
						// // TODO Auto-generated catch block
						// e.printStackTrace();
						// }
						byte[] _data = (command+"\r\n").getBytes("UTF-8");
							socket.send(new DatagramPacket(_data, _data.length, p
									.getSocketAddress()));
							b = System.currentTimeMillis();
						
					}
					
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		} catch (SocketException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
