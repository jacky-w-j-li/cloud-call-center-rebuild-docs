import org.apache.commons.codec.binary.Base64;
import sun.misc.BASE64Decoder;
import sun.misc.BASE64Encoder;
import sun.security.krb5.internal.crypto.Aes128;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.DESKeySpec;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Arrays;

/**
 * Created by yaxi on 15-9-30.
 */
public class Main {
    private final static String DES = "AES";
    static final String KEY_ALGORITHM = "AES";
    static final String CIPHER_ALGORITHM_CBC_NoPadding  = "AES/CBC/NoPadding";
    public static void main(String[] args) throws Exception {
        String data = "123 456";
        String key = "ikpio91pewrme31e";
//        System.err.println(encrypt(data, key));
        method4("{ts:\"144358491044\",uid:\"N00000000264\",email:\"zengyx@7moor.com\",name:\"曾雅希\",companyName:\"容联七陌\",phone:\"15001060374\"}");
//        method4("12345678abcdefgh");
//        System.err.println(decrypt("Cb8XuArVV8jVqbXSwwcvwKDjlaTVMxFm7dm7EkKySzPUEwvD7NCdtu/GR/uIr1Ef7bB1gOCJjyHOCTEDHmmizp72wN9JYBY9SZKnkv2bYzkNPeOOpRAgKlOI4ZcFccQYhbFwkZWGLNz7ojwskEkLfWgPAJTZSNRfxJ0/1Yp+4TYG0+FG4UitNxYFqdZsSzmg", key));


        String str = "KLy1fVtz0m3SSOu/0YLNNasl4svBDAhR+nSDvwKlyXdx9a2wmlgSP2sAC+negzCpveizzBn5hnDST67BnZNSsxbL0h9rUj983swyDGjwtkbhFk7AJYv4VDZ5OqgUvOxJBH9QzhHYwIsUC+DnpIYCm7TOUZsiS5ogmk8DKD3IsfmNuJ1KhUkyeC7hlj9VfYZk";
        System.out.println(str.length());
    }

    /**
     * Description 根据键值进行加密
     * @param data
     * @param key  加密键byte数组
     * @return
     * @throws Exception
     */
    public static String encrypt(String data, String key) throws Exception {
        byte[] bt = encrypt(data.getBytes(), key.getBytes());
        String strs = new BASE64Encoder().encode(bt);
        return strs;
    }

    /**
     * Description 根据键值进行解密
     * @param data
     * @param key  加密键byte数组
     * @return
     * @throws java.io.IOException
     * @throws Exception
     */
    public static String decrypt(String data, String key) throws IOException,
            Exception {
        if (data == null)
            return null;
        BASE64Decoder decoder = new BASE64Decoder();
        byte[] buf = decoder.decodeBuffer(data);
        byte[] bt = decrypt(buf,key.getBytes());
        return new String(bt);
    }

    /**
     * Description 根据键值进行加密
     * @param data
     * @param key  加密键byte数组
     * @return
     * @throws Exception
     */
    private static byte[] encrypt(byte[] data, byte[] key) throws Exception {
        // 生成一个可信任的随机数源
        SecureRandom sr = new SecureRandom();

        // 从原始密钥数据创建DESKeySpec对象
        DESKeySpec dks = new DESKeySpec(key);

        // 创建一个密钥工厂，然后用它把DESKeySpec转换成SecretKey对象
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);
        SecretKey securekey = keyFactory.generateSecret(dks);

        // Cipher对象实际完成加密操作
        Cipher cipher = Cipher.getInstance(DES);

        // 用密钥初始化Cipher对象
        cipher.init(Cipher.ENCRYPT_MODE, securekey, sr);

        return cipher.doFinal(data);
    }


    /**
     * Description 根据键值进行解密
     * @param data
     * @param key  加密键byte数组
     * @return
     * @throws Exception
     */
    private static byte[] decrypt(byte[] data, byte[] key) throws Exception {
        // 生成一个可信任的随机数源
        SecureRandom sr = new SecureRandom();

        // 从原始密钥数据创建DESKeySpec对象
        DESKeySpec dks = new DESKeySpec(key);

        // 创建一个密钥工厂，然后用它把DESKeySpec转换成SecretKey对象
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);
        SecretKey securekey = keyFactory.generateSecret(dks);

        // Cipher对象实际完成解密操作
        Cipher cipher = Cipher.getInstance(DES);

        // 用密钥初始化Cipher对象
        cipher.init(Cipher.DECRYPT_MODE, securekey, sr);

        return cipher.doFinal(data);
    }

    static Cipher cipher;
    static SecretKey secretKey;
    static byte[] getIV() {
        String iv = "ikpio91pewrme31e"; //IV length: must be 16 bytes long
        return iv.getBytes();
    }
    /**
     * 使用AES 算法 加密，默认模式 AES/CBC/NoPadding  参见上面对于这种mode的数据限制
     */
    static void method4(String str) throws Exception {
        System.out.println(str.length());
        cipher = Cipher.getInstance(CIPHER_ALGORITHM_CBC_NoPadding);
        //KeyGenerator 生成aes算法密钥
//        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance(DES);
        byte[] raw = "ikpio91pewrme31e".getBytes();
        SecretKeySpec skeySpec = new SecretKeySpec(raw, "AES");
//        secretKey = KeyGenerator.getInstance(KEY_ALGORITHM).generateKey();
//        System.out.println("密钥的长度为：" + skeySpec.getEncoded().length);

        cipher.init(Cipher.ENCRYPT_MODE, skeySpec, new IvParameterSpec(getIV()));//使用加密模式初始化 密钥
//        byte[] encrypt = cipher.update(str.getBytes(), 0, str.getBytes().length);
        byte[] srawt = str.getBytes("utf-8");
        int len = srawt.length;
        while(len % 16 != 0) len ++;
        byte[] sraw = new byte[len];
	        /* 在最后补0 */
        for (int i = 0; i < len; ++i) {
            if (i < srawt.length) {
                sraw[i] = srawt[i];
            } else {
                sraw[i] = 0;
            }
        }
        byte[] encrypted = cipher.doFinal(sraw);
//        byte[] encrypt= cipher.doFinal(str.getBytes("utf-8"), 0, str.getBytes().length); //按单部分操作加密或解密数据，或者结束一个多部分操作。

        System.out.println("method4-加密：" + Base64.encodeBase64String(encrypted).length());
        System.out.println("method4-加密：" +new sun.misc.BASE64Encoder().encode(encrypted));
        cipher.init(Cipher.DECRYPT_MODE, skeySpec, new IvParameterSpec(getIV()));//使用解密模式初始化 密钥
        byte[] decrypt = cipher.doFinal(encrypted);

        System.out.println("method4-解密后：" + new String(decrypt));

    }
}
