package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.exception.BaseRuntimeException;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.command.Fields;
import com.dishui.manager.service.AppConfig;
import com.dishui.model.VOResult;
import com.dishui.util.OooUtil;
import com.dishui.util.QiniuUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class KmHandler {
	private static Logger log = Logger.getLogger(KmHandler.class.getName());

	public static C5Response handle(C5Action action) {
		C5Response response = new C5Response(action);
		try {
			String method = action.getStringValue(Fields.Method);
			if(method.equals("transferFile")){
				String fileId = action.getStringValue("file");
				String trueName = action.getStringValue("trueName");
				String extenion="";
//				InputStream input=MongoProvider.getFileStreamById(fileId);
				if(trueName!=null){
					extenion=trueName.substring(trueName.indexOf("."));
				}
                String home=AppConfig.getInstance().getVar("kmdoc.dir");
				String input= home+fileId+extenion;
				File srcFile = new File(input);
				MongoProvider.writeFileStreamById(fileId, srcFile);
				String outpath=home+fileId+".html";
//				OutputStream output= new  BufferedOutputStream(new FileOutputStream(path));
//				BufferedInputStream in =new BufferedInputStream(input);
		        OooUtil ooo=new OooUtil();
//                String _input="\\\\vmware-host\\Shared Folders\\hotchwong\\tmp\\kmdoc\\"+fileId+extenion;

//                String _input="c:\\d33fc33976f44761ed09b226ead9a278.xls";
//                String _outpath="\\\\vmware-host\\Shared Folders\\hotchwong\\tmp\\kmdoc\\"+fileId+".html";
//		        ooo.transferDoc(_input, _outpath);
		        ooo.transferDoc(input, outpath);
		        String html=readFile(outpath);
                Document doc= Jsoup.parse(html);
                Elements footer =doc.body().select("div[type=FOOTER]");
                for (Element e: footer) {
                    e.empty();
                }
                Elements header =doc.body().select("div[type=HEADER]");
                for (Element e: header) {
                    e.empty();
                }

                html=doc.body().html();
                Elements imgs = doc.body().select("img[src^=" + fileId + "]");
                log.info("img size===="+imgs.size());
                if(imgs!=null && imgs.size()>0){
                    for (Element e: imgs) {
                        String imgName=e.attr("src");
                        log.info("imgName===="+imgName);
                        String path=home+imgName;
                        boolean isSuccess=QiniuUtil.upload(path,imgName);
                        if(isSuccess){
                            String url=QiniuUtil.getPrivateDownloadUrl(imgName);
                            log.info("download url===="+url);
                            html=html.replaceAll(imgName, url);
                            deleteFile(path);
                        }
                    }
                }
//                html=replaceImgPath(html, fileId);
				response.addParameter("fileId", fileId);
				response.addParameter("html", html);
                response.addParameter("kmNolog", "yes");//no print html to log
				response.setSucceed(true);
            }else if(method.equals("uploadImg")){
                String fileId = action.getStringValue("file");
                String trueName = action.getStringValue("trueName");
                String extenion="";
                if(trueName!=null){
                    extenion=trueName.substring(trueName.indexOf("."));
                }
                String input= AppConfig.getInstance().getVar("kmdoc.dir")+fileId+extenion;
//                System.out.println("input = [" + input + "]");
                File srcFile = new File(input);
                MongoProvider.writeFileStreamById(fileId, srcFile);

                String url=AppConfig.getInstance().getVar("kmimg.server.url")+fileId+extenion;
//                System.out.println("url = [" + url + "]");
				response.addParameter("url", url);
                response.setSucceed(true);
			}else if(method.equals("generateDic")){
				String itemId = action.getStringValue("itemId");
				String flag = action.getStringValue("flag");
				String accountId = action.getStringValue("accountId");
				String kmType = action.getStringValue("kmType");
				if(flag.equals("delete")){
//                    LuceneUtil.deleteIndex(accountId, itemId, kmType);
				}else if(flag.equals("batchDel")){
					DBObject temp= MongoProvider.findOne("app_km_delid", new BasicDBObject("_id", itemId));
					List<Object> list=(List)temp.get("ids");
					for (int i = 0; i < list.size(); i++) {
						String id=(String)list.get(i);
//						LuceneUtil.deleteIndex(accountId, id, kmType);
					}
				}else if(flag.equals("updateHits")){
//					DBObject km=MongoProvider.findOne("app_km_item", new BasicDBObject("_id",itemId));
//					String hits=km.get("hits")==null?"0":String.valueOf(km.get("hits"));
//					LuceneUtil.updateHitIndex(accountId, itemId, hits);
                }else{
                    String tbItem="app_km_item";
                    String tbContent="app_km_content";
                    if("outer".equals(kmType)){
                        tbItem=  "app_km_outer_item";
                        tbContent=  "app_km_outer_content";
                    }
                    DBObject km= MongoProvider.findOne(tbItem, new BasicDBObject("_id", itemId));
    				DBObject kmContent= MongoProvider.findOne(tbContent, new BasicDBObject("_id", itemId));
    				String id=(String)km.get("_id");
    				String cid=(String)km.get("cid");
    				String title=(String)km.get("title");
    				String hits=km.get("hits")==null?"0":String.valueOf(km.get("hits"));
    				String content=(String)kmContent.get("content");
    				if(flag.equals("insert")){
//    					LuceneUtil.createIndex(accountId, id, cid, title, hits, content, kmType);
    				}else{
//    					LuceneUtil.updateIndex(accountId, id, cid, title, hits, content, kmType);
    				}
                }
				response.setSucceed(true);
			}else if(method.equals("searchDic")){
				String keyWords = action.getStringValue("key");
//                if(keyWords!=null){
//                    keyWords=keyWords.replaceAll("__amp","&");
//                }
				String accountId = action.getStringValue("accountId");
                String kmType = action.getStringValue("kmType");
				int page = action.getIntValue("page");
				int pageSize = action.getIntValue("pageSize");
//				VOResult<Map<String,String>> result= LuceneUtil.highLightSearcher(accountId, keyWords, page, pageSize, kmType);
				
//				response.addParameter("list", result.getResult());
//				response.addParameter("count", result.getTotalRow());
				response.setSucceed(true);
			}
			return response;
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "transfer doc failed", e);
			response.setMessage(e.getMessage());
			response.setSucceed(false);
			if(e instanceof BaseRuntimeException){
				response.addParameter("code", ((BaseRuntimeException) e).getErrorCode());
			}
			response.addParameter("result", "500");
		}
		return response;
	}
    private static String readFile(String curfile) {
        File f = new File(curfile);
        try {
            if (!f.exists())
                throw new BaseRuntimeException("km003","上传文件不存在");
            FileReader cf = new FileReader(curfile);
//            InputStreamReader cf = new InputStreamReader (new FileInputStream(f),"GBK");
            BufferedReader is = new BufferedReader(cf);
            StringBuffer filecontent = new StringBuffer();
            String line = "";
            
            while ((line=is.readLine()) != null) {
                filecontent.append(line);
            }
            is.close();
            cf.close();
            return filecontent.toString();
        } catch (Exception e) {
            e.printStackTrace();
            throw new BaseRuntimeException("km003","不能读取文件");
        }
    }
    public static void deleteFile(String path) {
        File file = new File(path);
        if (file.isFile() && file.exists()) {
            file.delete();
        }
    }
    private static String replaceImgPath(String html,String key){
      String nStr= AppConfig.getInstance().getVar("kmimg.server.url")+key;
      html=html.replaceAll(key, nStr);
      return html;
    }

}
