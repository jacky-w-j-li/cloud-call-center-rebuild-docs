package com.dishui.util;


import com.artofsolving.jodconverter.DefaultDocumentFormatRegistry;
import com.artofsolving.jodconverter.DocumentConverter;
import com.artofsolving.jodconverter.DocumentFormatRegistry;
import com.artofsolving.jodconverter.openoffice.connection.OpenOfficeConnection;
import com.artofsolving.jodconverter.openoffice.connection.SocketOpenOfficeConnection;
import com.artofsolving.jodconverter.openoffice.converter.OpenOfficeDocumentConverter;
import com.artofsolving.jodconverter.openoffice.converter.StreamOpenOfficeDocumentConverter;
import com.dishui.exception.BaseRuntimeException;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ConnectException;
import java.util.logging.Logger;

public class OooUtil {
    private static Logger log = Logger.getLogger(OooUtil.class.getName());
    
    public  void transferDoc(String input,String output){
        log.info("entry transferDoc ::::::::::::");
        long time = System.currentTimeMillis();
        File inputFile = new File(input);
//        log.info("load inputFile ::::::::::::");
        File outputFile = new File(output);
//        log.info("load outputFile ::::::::::::");
        // connect to an OpenOffice.org instance running on port 8100
        OpenOfficeConnection conn= new SocketOpenOfficeConnection(8100);
        log.info("connect  OpenOfficeConnection ::::::::::::");
//        OpenOfficeConnection conn= new SocketOpenOfficeConnection("192.168.0.112",8100);
        try {
            conn.connect();
            log.info("connect  success ::::::::::::");
            // convert
            DocumentConverter converter = new OpenOfficeDocumentConverter(conn);
//            log.info("init  DocumentConverter ::::::::::::");
            converter.convert(inputFile, outputFile);
            log.info(input+" 文件转换成功");
        } catch (ConnectException e) {
            e.printStackTrace();
            throw new BaseRuntimeException("km001","连接文档转换服务器异常");
        }catch(Exception ex){
            ex.printStackTrace();
            throw new BaseRuntimeException("km002","文档转换失败，请检查或更换文档");
        } 
        finally {
            // close the connection
            if (conn != null && conn.isConnected()) {
                conn.disconnect();
            }
            long duration = System.currentTimeMillis() - time;
            String msg = String.format("%s消耗时间[%d ms]", "doc transfer", duration);
            log.info(msg);
        }
    }
    public  void transferDoc(InputStream input,OutputStream output){
        // connect to an OpenOffice.org instance running on port 8100
        OpenOfficeConnection conn= new SocketOpenOfficeConnection("192.168.0.112",8100);
        try {
            conn.connect();
            // convert

            DocumentConverter converter = new StreamOpenOfficeDocumentConverter(conn);
            DocumentFormatRegistry registry = new DefaultDocumentFormatRegistry();
            converter.convert(input, registry.getFormatByFileExtension("doc"), output, registry
                .getFormatByFileExtension("PDF"));
            log.info(input+" 文件转换成功");
        } catch (ConnectException e) {
            e.printStackTrace();
            throw new BaseRuntimeException("km001","连接文档转换服务器异常");
        }catch(Exception ex){
            ex.printStackTrace();
            throw new BaseRuntimeException("km002","文档转换失败，请检查或更换文档");
        } 
        finally {
            // close the connection
            if (conn != null && conn.isConnected()) {
                conn.disconnect();
            }
        }
    }
    
}
