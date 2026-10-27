package com.koala.smart.server.pool;

import java.nio.ByteBuffer;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.pool.PoolableObjectFactory;
import org.apache.commons.pool.impl.StackObjectPool;

import com.koala.smart.server.SmartServer;

public class BufferPool {

	StackObjectPool pool;

	private final static Logger logger = Logger.getLogger(BufferPool.class
			.getName());

	public BufferPool(SmartServer server) {
		PoolableObjectFactory factory = new BufferFactory(server);
		int max = server.getServerConfig().getBufferPoolConfig().getMaxBuffer();
		int init = server.getServerConfig().getBufferPoolConfig().getInitBuffer();
		pool = new StackObjectPool(factory, max, init);
		logger.info("Buffer pool created: max="+max+" init="+init);
	}

	public ByteBuffer borrowBuffer() {
		try {
			return (ByteBuffer) pool.borrowObject();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	public void returnBuffer(ByteBuffer buffer) {
		try {
			pool.returnObject(buffer);
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public int getNumActive() {
		if (pool != null)
			return pool.getNumActive();
		return 0;
	}

	public int getNumIdle() {
		if (pool != null)
			return pool.getNumIdle();
		return 0;
	}

	public void clear() {
		pool.clear();
		logger.info("session pool cleared");
	}

	public void close() {
		try {
			pool.close();
			pool = null;
		} catch (Exception e) {
			logger.log(Level.WARNING, "error when close session pool", e);
		}
	}
}
