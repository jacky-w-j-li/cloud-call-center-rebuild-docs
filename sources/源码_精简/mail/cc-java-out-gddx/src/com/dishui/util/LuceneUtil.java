package com.dishui.util;

import com.dishui.manager.service.AppConfig;
import com.dishui.model.VOResult;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.IndexWriterConfig.OpenMode;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.*;
import org.apache.lucene.search.highlight.*;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;
import org.jsoup.Jsoup;
import org.wltea.analyzer.lucene.IKAnalyzer;
import org.wltea.analyzer.lucene.IKQueryParser;
import org.wltea.analyzer.lucene.IKSimilarity;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class LuceneUtil {
	private static final Logger log = Logger.getLogger(LuceneUtil.class.getName());
//	public static Analyzer analyzer = new PaodingAnalyzer();
	public static Analyzer analyzer = new IKAnalyzer();//默认实现最细粒度切分算法
	private static String[] postfixs={".html"};

    private static String getRootPath(String kmType){
        String _root="lucene.dir";
        if("outer".equals(kmType)){
            _root="lucene.dir.outer";
        }
        return _root;
    }
	/**
	 * 将文本创建索引文件
	 */
	@SuppressWarnings("deprecation")
	public static void createIndex(String accountId,String itemId,String catalogId,String title,String hits,String content,String kmType) {
		IndexWriter writer=null;
		FSDirectory dir=null;
		try{
            String _root=getRootPath(kmType);

			String path= AppConfig.getInstance().getVar(_root)+accountId;
			File indexDir=new File(path);
//            if(!indexDir.exists() && !indexDir.isDirectory()){
//                indexDir.mkdir();
//            }
			dir= FSDirectory.open(indexDir);
			IndexWriterConfig conf = new IndexWriterConfig(Version.LUCENE_34,analyzer);
			conf.setOpenMode(OpenMode.CREATE_OR_APPEND);
			writer=new IndexWriter(dir,conf);

			Document doc=new Document();
			doc.add(new Field("itemId",itemId, Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("title",title, Field.Store.YES, Field.Index.ANALYZED));
			doc.add(new Field("content",content, Field.Store.YES, Field.Index.ANALYZED));
			doc.add(new Field("lastTime", DateUtil.getCurrentTime(), Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("hits",hits, Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("catalogId",catalogId, Field.Store.YES, Field.Index.NO));
			writer.addDocument(doc);
			writer.commit();
			writer.optimize();//优化索引
		}catch(Exception e){
		    e.printStackTrace();
		}finally{
			try{
				if(writer!=null)writer.close();
				if(dir!=null)dir.close();
			}catch(IOException ex){
				ex.printStackTrace();
			}
		}
	}
	/**
	 * 删除索引
	 * @param indexDir
	 * @param fileId
	 */
	@SuppressWarnings("deprecation")
	public static void deleteIndex(String accountId,String itemId,String kmType){
		FSDirectory dir=null;
		IndexWriter writer=null;
		try{
            String _root=getRootPath(kmType);
			String path= AppConfig.getInstance().getVar(_root)+accountId;
			File indexDir=new File(path);
			if(!indexDir.exists())return;
			dir= FSDirectory.open(indexDir);
			IndexWriterConfig conf = new IndexWriterConfig(Version.LUCENE_34,analyzer);
			writer=new IndexWriter(dir,conf);
			writer.deleteDocuments(new Term("itemId",itemId));
			writer.commit();
		}catch(Exception e){
		    e.printStackTrace();
		}finally{
			try{
				if(writer!=null)writer.close();
				if(dir!=null)dir.close();
			}catch(Exception ex){
				ex.printStackTrace();
			}
		}
	}
	/**
	 * 更新文本索引文件
	 */
	@SuppressWarnings("deprecation")
	public static void updateIndex(String accountId,String itemId,String catalogId,String title,String hits,String content,String kmType){
		IndexWriter writer=null;
		FSDirectory dir=null;
		try{
            String _root=getRootPath(kmType);
			String path= AppConfig.getInstance().getVar(_root)+accountId;
			File indexDir=new File(path);
			if(!indexDir.exists())return;
			dir= FSDirectory.open(indexDir);
			IndexWriterConfig conf = new IndexWriterConfig(Version.LUCENE_34,analyzer);
			conf.setOpenMode(OpenMode.CREATE_OR_APPEND);
			writer=new IndexWriter(dir,conf);
			Document doc=new Document();
			doc.add(new Field("itemId",itemId, Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("title",title, Field.Store.YES, Field.Index.ANALYZED));
			doc.add(new Field("content",content, Field.Store.YES, Field.Index.ANALYZED));
			doc.add(new Field("lastTime", DateUtil.getCurrentTime(), Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("hits",hits, Field.Store.YES, Field.Index.NOT_ANALYZED));
			doc.add(new Field("catalogId",catalogId, Field.Store.YES, Field.Index.NO));
			writer.updateDocument(new Term("itemId",itemId), doc,analyzer);
			writer.commit();
			writer.optimize();
		}catch(Exception e){
			e.printStackTrace();
		}finally{
			try{
				if(writer!=null)writer.close();
				if(dir!=null)dir.close();
			}catch(IOException ex){
				ex.printStackTrace();
			}
		}
	}

	// 普通检索并输出
	public static TopDocs searcher(File indexDir,String fieldName, String keyWords){
		TopDocs topDocs=null;
		try{
			if(!indexDir.exists())return topDocs;
			FSDirectory dir= FSDirectory.open(indexDir);
			IndexSearcher searcher = new IndexSearcher(dir);
			searcher.setSimilarity(new IKSimilarity());
            Query query = IKQueryParser.parse(fieldName, keyWords);
			TopScoreDocCollector results= TopScoreDocCollector.create(12, false);
			searcher.search(query,results);
			topDocs= results.topDocs(1,10);
			ScoreDoc[] scoreDoc = topDocs.scoreDocs;
			for (int i = 0; i < scoreDoc.length; i++) {
				Document doc = searcher.doc(scoreDoc[i].doc);
			}
			searcher.close();
		}catch(Exception e){e.printStackTrace();}
		return topDocs;
	}
	/**
	 * 模糊分页查询，并把关键字进行高亮显示
	 */
	public static VOResult<Map<String,String>> highLightSearcher(String accountId,String keyWords,int pageNum,int pageSize,String kmType){
		VOResult<Map<String,String>> result=new VOResult<Map<String,String>>();
		List<Map<String,String>> list=new ArrayList<Map<String,String>>();
		FSDirectory dir=null;
		IndexSearcher searcher=null;
		try{
            String _root=getRootPath(kmType);
			String path= AppConfig.getInstance().getVar(_root)+accountId;
			File indexDir=new File(path);
			if(!indexDir.exists())return result;
			dir= FSDirectory.open(indexDir);
			searcher = new IndexSearcher(dir);
            //在索引器中使用IKSimilarity相似度评估器 
			searcher.setSimilarity(new IKSimilarity());
            String kw="title:'"+keyWords+"'||content:'"+keyWords+"'";
            Query query = IKQueryParser.parse(kw);
			TopScoreDocCollector results= TopScoreDocCollector.create(pageNum * pageSize, false);
			searcher.search(query, results);
			
			System.out.println("查询总记录数："+results.getTotalHits());
			result.setTotalRow(results.getTotalHits());//总记录数
			result.setBeginPage(pageNum);//开始页
			result.setPageSize(pageSize);//每页显示条数
			TopDocs topDocs=results.topDocs(pageSize*(pageNum-1),pageSize);
			ScoreDoc[] scoreDoc = topDocs.scoreDocs;
	
			Formatter simpleHTMLFormatter = new SimpleHTMLFormatter(
					"<font color='red'>", "</font>");
			Highlighter highlighter = new Highlighter(simpleHTMLFormatter,
					new QueryScorer(query));
			highlighter.setTextFragmenter(new SimpleFragmenter(Integer.MAX_VALUE));//显示多少字
			for (int i = 0; i < scoreDoc.length; i++) {
				Document doc = searcher.doc(scoreDoc[i].doc);
				String title=highlighter.getBestFragment(analyzer, "title", doc.get("title"));
				title=(title==null)?doc.get("title"):title;
				String content=highlighter.getBestFragment(analyzer, "content", doc.get("content"));
				content=(content==null)?doc.get("content"):content;
				content=content.length()>200?content.substring(0,200)+"...":content;
                org.jsoup.nodes.Document cDoc= Jsoup.parse(content);
                content =cDoc.body().html();
				Map<String,String> item=new HashMap<String,String>();
				item.put("itemId", doc.get("itemId"));
				item.put("title", title);
				item.put("content", content);
				item.put("lastTime", doc.get("lastTime"));
				item.put("hits", doc.get("hits"));
				item.put("cid", doc.get("catalogId"));
				list.add(item);
			}
		}catch(Exception e){
			log.info(e.getMessage());
			e.printStackTrace();
		}finally{
			try{
				if(searcher!=null)searcher.close();
				if(dir!=null)dir.close();
			}catch(IOException e){
				e.printStackTrace();
			}
		}
		result.setResult(list);
		return result;
	}
}
