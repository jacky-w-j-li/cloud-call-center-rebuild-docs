package com.koala.smart.test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;

public class TestWrite {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		try {
			ServerSocketChannel ssc = ServerSocketChannel.open();
			ServerSocket ss = ssc.socket();
			ss.bind(new InetSocketAddress("0.0.0.0", 9090));
			ssc.configureBlocking(false);
			Selector selector = Selector.open();
			ssc.register(selector, SelectionKey.OP_ACCEPT);
			byte[] data = new byte[1024*1000*10]; 
			for(int i=0;i<data.length;i++){
				data[i] = 'a';
			}
			ByteBuffer buffer = ByteBuffer.allocate(data.length);
			buffer.put(data);
			while (true) {
				try {
					int n = selector.select();
					if (n == 0)
						continue;
					Iterator<SelectionKey> it = selector.selectedKeys()
							.iterator();
					while (it.hasNext()) {
						SelectionKey key = it.next();
						if (key.isAcceptable()) {
							ServerSocketChannel channel = (ServerSocketChannel) key
									.channel();
							SocketChannel sc = channel.accept();
							long a = System.currentTimeMillis();
							buffer.flip();
							sc.write(buffer);
							sc.socket().getOutputStream().flush();
							a = a - System.currentTimeMillis();
							System.out.println("time: "+a);
//							channel.register(selector, SelectionKey.OP_ACCEPT);
							it.remove();
						}
					}
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
	}

}
