package com.dishui.util;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.logging.Logger;

import javax.imageio.ImageIO;

import com.dishui.manager.service.AppConfig;
import net.coobird.thumbnailator.Thumbnails;



public class Thumbnail {
    private static Logger log = Logger.getLogger(Thumbnail.class.getName());
    private static final int sumLine=1280;//计算分辨率标准线

    public  static void generateThum100(String path,String fileName){
        String name="";
        String extName="";
        try {
            if(fileName==null ||fileName.trim().equals("")){return;}
            int idx=fileName.lastIndexOf(".");
            if (idx >= 0) {
                extName = fileName.substring(idx);
                name=fileName.substring(0,idx);
            }
            Thumbnails.of(new File(path+fileName)).forceSize(100,100).toFile(new File(path+fileName+"_small"+extName));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public  static boolean generatePic(InputStream srcFile,String account,String fileId,String extenion,String destPath){

        File file=new File(destPath);

        if(!file.isDirectory()){file.mkdirs();}
        if(fileId==null ||fileId.trim().equals("")){return false;}
        try {
            BufferedImage img = ImageIO.read(srcFile);
            if(img==null) return false;
            double width=img.getWidth();
            double height=img.getHeight();

            String _fileName = fileId + "_big" + extenion;
            if(width>sumLine){
                Thumbnails.of(img).width(sumLine).toFile(new File(destPath+_fileName));
            }else{
                Thumbnails.of(img).width((int) width).toFile(new File(destPath + _fileName));
            }
            _fileName = fileId + "_small" + extenion;
            File detFile_thum=new File(destPath+_fileName);
            Thumbnails.of(img).scale(Math.max(100/width, 100/height)).toFile(detFile_thum);
            Thumbnails.of(detFile_thum).size(100,100).sourceRegion(0,0,100,100).toFile(detFile_thum);
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }catch(Exception ex){
            ex.printStackTrace();
            return false;
        }
    }
    public  static String generatePic(String path,String fileName){
        String big= AppConfig.getInstance().getVar("customer.pic");
        String thum= AppConfig.getInstance().getVar("customer.pic");

        String src=path+fileName;
        File file=new File(big);
        File file2=new File(thum);

        if(!file.isDirectory()){file.mkdirs();}
        if(!file2.isDirectory()){file2.mkdirs();}

        if(fileName==null ||fileName.trim().equals("")){return "";}
        try {
            File srcFile=new File(src);
            BufferedImage img = ImageIO.read(srcFile);

            if(img==null) return "";
            double width=img.getWidth();
            double height=img.getHeight();

            int idx=fileName.lastIndexOf(".");

            if(width>=666 && width<=sumLine){
                fileName=fileName.substring(0,idx)+"_big"+fileName.substring(idx);
                Thumbnails.of(new File(src)).width((int)width).toFile(new File(big+fileName));
            }else if(width>sumLine){
                fileName=fileName.substring(0,idx)+"_big"+fileName.substring(idx);
                Thumbnails.of(new File(src)).width(sumLine).toFile(new File(big+fileName));
            }else{
                Thumbnails.of(new File(src)).width((int)width).toFile(new File(big+fileName));
            }

            File detFile_thum=new File(thum+fileName);
            Thumbnails.of(srcFile).scale(Math.max(100 / width, 100 / height)).toFile(detFile_thum);
            Thumbnails.of(detFile_thum).size(100, 100).sourceRegion(0, 0, 100, 100).toFile(detFile_thum);

            return fileName;
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }catch(Exception ex){
            ex.printStackTrace();
            return "";
        }
    }

    /**
     * @param args
     */
    public static void main(String[] args) {
        try {
            long time = System.currentTimeMillis();
            File file=new File("/Users/hotchwong/test.jpg");
            File file2=new File("/Users/hotchwong/thumbnail4.jpg");
//            File file3=new File("c:/thumbnail4.jpg");
            BufferedImage img = ImageIO.read(file);
            double width=img.getWidth();
            double height=img.getHeight();
            int size = (int)Math.min(width, height);
//            Thumbnails.of(file).sourceRegion(0,0,size,size).size(120,120).toFile(new File("/Users/hotchwong/thumbnail3.jpg"));
//            Thumbnails.of(file).sourceRegion(0,0,size,size).size(100,100).toFile(new File("/Users/hotchwong/thumbnail4.jpg"));
            int miniwidth = 200;// 缩略图宽度
            int miniheight = 200;// 缩略图高度
            double ratew = miniwidth / width;
            double rateh = miniheight / height;
            double rate = Math.max(ratew, rateh);
//            Thumbnails.of(file).forceSize(200,200).toFile(file2);
//            Thumbnails.of(file).width(530).toFile(file3);
//            Thumbnails.of(file).width(1280).toFile(file2);

//            Thumbnails.of(file).scale(rate).toFile(file2);
//            Thumbnails.of(file2).size(200,200).sourceRegion(0,0,200,200).toFile(file2);
            int _width=Integer.parseInt(String.valueOf(Math.round(width)));
            int _height=Integer.parseInt(String.valueOf(Math.round(height))) ;
//            if(width>height){
//                Thumbnails.of(file).width(200).toFile(file2);
//                Thumbnails.of(file).height(_height).toFile(file2);
//                Thumbnails.of(file).scale(Math.max(200/width, 200/height)).toFile(file2);
//                Thumbnails.of(file2).size(200,200).sourceRegion(0,0,200,200).toFile(file2);
//            }else{
//                Thumbnails.of(file).width(1280).toFile(file2);
//            }
            Thumbnails.of(file).scale(Math.max(100/width, 100/height)).toFile(file2);
            Thumbnails.of(file2).size(100,100).sourceRegion(0,0,100,100).toFile(file2);
//            Thumbnails.of(file2).forceSize(200,200).toFile(file2);
            Thumbnails.of(file2).size(100,100).toFile(file2);
            long duration = System.currentTimeMillis() - time;
            String msg = String.format("消耗时间[%d]", duration);
            log.info(msg);
        } catch (IOException e) {
            e.printStackTrace();
        }

    }


}