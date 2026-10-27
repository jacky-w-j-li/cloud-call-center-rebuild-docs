package com.koala.smart.test;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Random;

/**
 * This class is a singleton and contains pieces of code that are used throughout the VEIL but don't have a convenient
 * home
 */
public class Utils
{

    private static Utils _instance = null;

    private Utils()
    {/* constructor */
    }

    /**
     * The Utils class is a singelton. Instead of creating an instance of the object, please request an instance using
     * this function.
     * 
     * @return an instance of the Utils class.
     */
    public Utils getInstance()
    {
        if (_instance == null)
        {
            _instance = new Utils();
        }

        return _instance;
    }

    /**
     * The clean line function is used to parse Asterisk config files. Primarily, it strips extra or unecessary spaces
     * and skips lines that start with a ';'
     * 
     * @param targetLine
     *            Line from the Asterisk log file
     * @return Line mins starting and trailing spaces and any comments. If a line starting with ';' or a null string is
     *         provided, null is returned.
     */
//    public static String cleanLine(String targetLine)
//    {
//        if (targetLine == null)
//        {
//            return null;
//        }
//        String temp = targetLine;
//        // while(temp != null){
//        int commentStart = temp.indexOf(';');
//        // Did the line start with a ;? If so skip it
//        if (commentStart != 0)
//        {
//            // Strip out end of line comments
//            if (commentStart > 0)
//            {
//                temp = temp.substring(0, commentStart);
//            }
//
//            // Remove extra spaces
//            temp = temp.trim();
//            if ((AsteriskConstants.VEIL_END_LINE).equals(temp) || temp.length() == 0)
//            {
//                temp = null;
//            }
//
//            return (temp);
//        }
//        return null;
//    }

    // Set up random generator with current time seed
    static private Random randGen = new Random(System.currentTimeMillis());

    /**
     * Generate a random, numerical password
     * 
     * @param length
     *            desired length of the password
     * @return the password as a string
     */
    static public String generateNumericPassword(int length)
    {
        // catch length 0
        if (length == 0)
            return null;

        StringBuffer pass = new StringBuffer();
        for (int i = 0; i < length; i++)
        {
            // generate random number that are 0 - 9 (10 is exclusive)
            pass.append(randGen.nextInt(10));
        }
        return pass.toString();
    }

    static private char[] toAN = { 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q',
            'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };

    /**
     * Generate a random alpha-numeric password
     * 
     * @param length
     *            length of the password
     * @param includeUpperCase
     *            include upper case letters, otherwise all lowercase
     * @return the randomly generated password
     */
    static public String generateAlphaNumericPassword(int length, boolean includeUpperCase)
    {
        // catch length 0
        if (length == 0)
            return null;

        int index = 0;

        StringBuffer pass = new StringBuffer();
        for (int i = 0; i < length; i++)
        {
            // generate random number that are 0 - toAn*2-10
            if (includeUpperCase)
            {
                index = randGen.nextInt((toAN.length * 2) - 10);
            }
            else
            {
                index = randGen.nextInt(toAN.length);
            }
            if (index < toAN.length)
            {

                pass.append(toAN[index]);

            }
            else
            {

                pass.append(Character.toUpperCase(toAN[index - toAN.length]));

            }
        }
        return pass.toString();
    }
    
	private static Random rad = new Random();

	public static long getRandom32() {
		long r = rad.nextLong();
		return (r < 0) ? (-r) : r;
	}

	public static String getSynActionID(String startName) {
		return startName.trim()+getRandom32();
	}
	
	/**
	 * 
	 * @param formate "yyyy-MM-dd HH:mm:ss"
	 * @return
	 */
	public static String getDate(String formate){
		DateFormat df = new SimpleDateFormat(formate);
		String date = df.format(new Date());
		return date;
	}

}
