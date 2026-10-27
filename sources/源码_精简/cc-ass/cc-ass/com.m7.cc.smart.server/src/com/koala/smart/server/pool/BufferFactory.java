package com.koala.smart.server.pool;

import java.nio.ByteBuffer;

import org.apache.commons.pool.PoolableObjectFactory;

import com.koala.smart.server.SmartServer;

public class BufferFactory implements PoolableObjectFactory{
	private SmartServer server;
	
	public BufferFactory(SmartServer server){
		this.server = server;
	}
	
	public void activateObject(Object arg0) throws Exception {
		// TODO Auto-generated method stub
		
	}

	public void destroyObject(Object arg0) throws Exception {

	}

	public Object makeObject() throws Exception {
		return ByteBuffer.allocate(server.getServerConfig().getPacketSize());
	}

	public void passivateObject(Object arg0) throws Exception {
		((ByteBuffer)arg0).clear();
	}

	public boolean validateObject(Object arg0) {
		return true;
	}

}
