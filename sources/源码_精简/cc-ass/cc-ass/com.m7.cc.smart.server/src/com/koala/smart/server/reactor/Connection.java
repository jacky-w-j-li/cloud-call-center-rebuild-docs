package com.koala.smart.server.reactor;

import java.io.IOException;
import java.net.InetAddress;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.SocketChannel;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.MalformedInputException;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.koala.smart.server.Session;
import com.koala.smart.server.SmartServer;
import com.koala.smart.server.config.ServerConfig;

public class Connection implements Runnable{

	private String id = "";
	private SocketChannel channel;
	private Dispatcher dispatcher;
	private SmartServer server;
	private InetAddress address;
	private ByteBuffer buffer;
	private CharsetDecoder decoder;
	private byte[] temData;
	
	ConnectReader reader;
	
	ConnectWriter writer;
	
	private boolean isClosing = false;

	private int port = 0;

	private Session session;

	private final static Logger log = Logger.getLogger(Connection.class
			.getName());

	public Connection(SmartServer server, Dispatcher dispatcher,
			SocketChannel channel) {
		this.reader = new ConnectReader(this);
		this.writer = new ConnectWriter(this);
		this.server = server;
		this.dispatcher = dispatcher;
		this.channel = channel;
		//begin time
		long beginTime = System.currentTimeMillis();
		address = channel.socket().getInetAddress();
		long midTime = System.currentTimeMillis();
		port = channel.socket().getPort();
		long endTime = System.currentTimeMillis();
		if(endTime - beginTime > 300){
			log.warning("Agi new Connection time > 300ms getInetAddress+getPort:"+(endTime - beginTime));			
		}
		if(endTime - midTime > 300){
			log.warning("Agi new Connection time > 300ms getPort:"+(endTime - midTime));			
		}
		//end time
		id = address + ":" + port;
		if (server.getServerConfig().getDataMode().equalsIgnoreCase(
				ServerConfig.STRING)) {
			Charset charset = Charset.forName(server.getServerConfig()
					.getCharset());
			decoder = charset.newDecoder();
		}
	}

	public void setSession(Session session) {
		this.session = session;
	}

	public SocketChannel getChannel() {
		return channel;
	}

	public boolean isOpen() {
		if (channel == null)
			return false;
		return channel.isOpen();
	}

	public void read() {
		try {
			if (channel != null && channel.isOpen() && !isClosing) {
				ByteBuffer buffer = getBuffer();
				try {
					int count = channel.read(buffer);
					buffer.flip();
					if (count < 0) {
						// TODO channel has been closed
						log.fine("channel ended [" + id + "]");
						returnBuffer(buffer);
						close();
					} else if (count == 0) {
						log.warning("Get 0 byte from socket!"+System.currentTimeMillis());
						returnBuffer(buffer);
					} else {
						if (server.getServerConfig().getDataMode()
								.equalsIgnoreCase(ServerConfig.STRING)) {
							ByteBuffer buffer1 = null;
							if (temData != null) {
								buffer1 = ByteBuffer.allocate(buffer.limit()
										+ temData.length);
								for (int i = 0; i < temData.length; i++) {
									buffer1.put(temData[i]);
								}
								temData = null;
								buffer1.put(buffer.array(), 0, buffer.limit());
								buffer1.flip();
							}
							if(buffer1 == null)
								buffer1 = buffer;
							try {
								CharBuffer str = decoder.decode(buffer1);
								session.read(str.toString());
								returnBuffer(buffer);
								resumeRead();
							} catch (MalformedInputException e) {
								log.log(Level.WARNING,
												"Get imcomplete data", e);
								int a = e.getInputLength();
								byte[] data = new byte[buffer1.limit() - a];
								temData = new byte[a];
								System.arraycopy(buffer1.array(), 0, data, 0,
										data.length);
								System.arraycopy(buffer1.array(), data.length,
										temData, 0, a);
								session.read(new String(data, server
										.getServerConfig().getCharset()));
								returnBuffer(buffer);
								resumeRead();
							} catch (CharacterCodingException e) {
								log.log(Level.WARNING,
												"Get imcomplete data[ERROR Charset], cannot handle this error",
												e);
								close();
							}
						} else if (server.getServerConfig().getDataMode()
								.equalsIgnoreCase(ServerConfig.BYTE)) {
							byte[] data = new byte[buffer.limit()];
							System.arraycopy(buffer.array(), 0, data, 0,
									data.length);
							returnBuffer(buffer);
							session.read(data);
						}

					}
				} catch (Throwable e) {
					returnBuffer(buffer);
					close();
					log.log(Level.FINE, "read channel failed [" + id + "]", e);
				}
			}
		} catch (Throwable e) {
			log.log(Level.WARNING, "read channel failed [" + id + "]", e);
		}

	}

	public void write() {
		if (isClosing || channel == null)
			return;

		if (!channel.isOpen()) {
			log.warning("try to send data via a nonopenned channel: " + id);
			return;
		}

		// the buffer is not null, that means there is data we did not send
		// completely in the previous process. So we need to send it first.
		if (buffer != null) {
			try {
				channel.write(buffer);
			} catch (IOException e) {
				log.log(Level.FINE, "Send data failed [" + id + "]", e);
				close();
				return;
			}
			if (buffer.hasRemaining()) {
				resumeWrite();
			} else {
				if (server.getServerConfig().isPoolBuffer())
					server.getBufferPool().returnBuffer(buffer);
				buffer = null;
			}
		}

		// then we get a
		try {
			if (session.toSendData == null || session.toSendData.isEmpty()
					|| isClosing) {
				return;
			} 
			synchronized (session.toSendData) {
				while (session.toSendData.size() > 0) {
					buffer = getBuffer();
					buffer.put(session.toSendData.remove(0));
					buffer.flip();
					try {
						channel.write(buffer);
						// The socket buffer is overflow, keep it for next
						// sending
						if (buffer.hasRemaining()) {
							return;
						} else {
							if (server.getServerConfig().isPoolBuffer())
								server.getBufferPool().returnBuffer(buffer);
							buffer = null;
						}
					} catch (Exception e) {
						log.log(Level.FINE,
								"Send data failed [" + id + "]", e);
						close();
						return;
					}
				}
			}
		} catch (Throwable e) {
			log.log(Level.WARNING, "Send data failed [" + id + "]", e);
		}
	}

	private ByteBuffer getBuffer() {
		ByteBuffer buffer = null;
		if (server.getServerConfig().isPoolBuffer()) {
			buffer = server.getBufferPool().borrowBuffer();
		} else {
			buffer = ByteBuffer.allocate(server.getServerConfig()
					.getPacketSize());
		}
		return buffer;
	}

	private void returnBuffer(ByteBuffer buffer) {
		if (server.getServerConfig().isPoolBuffer()) {
			server.getBufferPool().returnBuffer(buffer);
		}
	}

	public void close() {
		if (isClosing)
			return;
		isClosing = true;
		log.fine("Close connection [" + id + "]");
		if(dispatcher != null) {
			dispatcher.unregister(this);
			dispatcher = null;
		}
		if(session != null){
			session.close();
			session = null;
		}
		// server = null;
		address = null;
	}

	public void unregistered() {
		if (channel != null)
			try {
				channel.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		channel = null;
	}

	public InetAddress getAddress() {
		return address;
	}

	public int getPort() {
		return port;
	}

	public void resumeWrite() {
		if (isClosing)
			return;
		try {
			dispatcher.register(this, SelectionKey.OP_WRITE);
		} catch (Exception e) {
			log.log(Level.WARNING, "resumeWrite", e);
		}
	}

	public void resumeRead() {
		if (isClosing)
			return;
		try {
			dispatcher.register(this, SelectionKey.OP_READ);
		} catch (Exception e) {
			log.log(Level.WARNING, "resumeRead", e);
			close();
		}
	}
	


	@Override
	public void run() {
		read();
	}
}

class ConnectReader implements Runnable {
	private Connection connection;
	
	public ConnectReader(Connection connection) {
		this.connection = connection;
	}
	
	@Override
	public void run() {
		connection.read();
	}
	
}

class ConnectWriter implements Runnable {
	private Connection connection;
	
	public ConnectWriter(Connection connection) {
		this.connection = connection;
	}
	
	@Override
	public void run() {
		connection.write();
	}
	
}
