package com.m7.cc.sip.proxy;

public class RC4 {

	private byte state[] = new byte[256];
	private int x;
	private int y;

	/**
	 * 62 * Initializes the class with a string key. The length 63 * of a normal
	 * key should be between 1 and 2048 bits. But 64 * this method doens't check
	 * the length at all. 65 * 66 * @param key the encryption/decryption key 67
	 */
	public RC4(String key) throws NullPointerException {
		this(key.getBytes());
	}

	/**
	 * Initializes the class with a byte array key. The length of a normal key
	 * should be between 1 and 2048 bits. But this method doens't check the
	 * length at all.
	 * 
	 * @param key
	 *            the encryption/decryption key
	 */
	public RC4(byte[] key) throws NullPointerException {

		for (int i = 0; i < 256; i++) {
			state[i] = (byte) i;
		}

		x = 0;
		y = 0;

		int index1 = 0;
		int index2 = 0;

		byte tmp;

		if (key == null || key.length == 0) {
			throw new NullPointerException();
		}

		for (int i = 0; i < 256; i++) {

			index2 = ((key[index1] & 0xff) + (state[i] & 0xff) + index2) & 0xff;

			tmp = state[i];
			state[i] = state[index2];
			state[index2] = tmp;

			index1 = (index1 + 1) % key.length;
		}

	}

	/**
	 * 113 * RC4 encryption/decryption. 114 * 115 * @param data the data to be
	 * encrypted/decrypted 116 * @return the result of the encryption/decryption
	 */
	public byte[] rc4(String data) {

		if (data == null) {
			return null;
		}

		byte[] tmp = data.getBytes();

		return this.rc4(tmp);
	}

	/**
	 * RC4 encryption/decryption. 133 * 134 * @param buf the data to be
	 * encrypted/decrypted 135 * @return the result of the encryption/decryption
	 * 136
	 */
	public byte[] rc4(byte[] buf) {

		// int lx = this.x;
		// int ly = this.y;

		int xorIndex;
		byte tmp;

		if (buf == null) {
			return null;
		}

		byte[] result = new byte[buf.length];

		for (int i = 0; i < buf.length; i++) {

			x = (x + 1) & 0xff;
			y = ((state[x] & 0xff) + y) & 0xff;

			tmp = state[x];
			state[x] = state[y];
			state[y] = tmp;

			xorIndex = ((state[x] & 0xff) + (state[y] & 0xff)) & 0xff;
			result[i] = (byte) (buf[i] ^ state[xorIndex]);
		}

		// this.x = lx;
		// this.y = ly;

		return result;
	}

}
