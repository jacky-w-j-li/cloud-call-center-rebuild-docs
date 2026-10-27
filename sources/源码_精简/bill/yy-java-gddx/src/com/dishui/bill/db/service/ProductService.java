package com.dishui.bill.db.service;

import com.dishui.bill.common.Constants;
import com.dishui.bill.db.model.Intl;
import com.dishui.bill.db.model.Product;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;

/**
 * Created by jackwong on 16/3/17.
 */
public class ProductService {

    public static Product getByAccountAndProduct(String account, String product){
        if(account==null || product==null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("account",account).append("product",product);
        DBObject dbObj = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition);

        return Product.fromDB(dbObj);
    }

    public static Product get(String id){
        if(id == null){
            return null;
        }

        BasicDBObject condition = new BasicDBObject("_id",id);
        DBObject dbObj = MongoProvider.findOne(Constants.DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT,condition);

        return Product.fromDB(dbObj);
    }

    public static Product.IntlFee getIntlFeeByNumber(String did, String productId) {
        if(did == null || did.isEmpty() || !did.startsWith("00") || productId == null){
            return null;
        }

        Product product = get(productId);
        if(product == null){
            return null;
        }

        Product.IntlFee matchFee = null;

        String number = did.substring(2);
        //优先使用新的国际长途资费设置
        Product.IntlFeeSet intlFeeSet = product.getIntlFeeSet();
        if(intlFeeSet != null && intlFeeSet.isOpenIntl()) {
            List<Product.IntlFee> fees = intlFeeSet.getFees();
            if (fees != null && !fees.isEmpty()) {
                int matchLength = 0;
                for (Product.IntlFee fee : fees) {
                    String code = fee.getCode();
                    if (number.startsWith(code) && matchLength < code.length()) {
                        matchFee = fee;
                        matchLength = code.length();
                    }
                }
            }

            //如果没有找到号码对应的资费设置,且允许拨打配置之外地区的国际长途
            if(matchFee == null && intlFeeSet.isAllowOther()){
                matchFee = new Product.IntlFee();

                Intl intl = IntlService.getByNumberAndLine(did,intlFeeSet.getLine());
                if(intl != null){
                    matchFee.setCode(intl.getCode());
                }
                matchFee.setPrice(intlFeeSet.getOtherPrice());

                return matchFee;
            }
        }

        //if(matchFee != null){
        return matchFee;
        //}

        //如果没有设置新的国际长途逻辑,走原来的数据构建一个IntlFee
//        if(this.getInternationalStrategy()!=null){
//            matchFee = new IntlFee();
//            if (did.startsWith("00852") || did.startsWith("00853") || did.startsWith("00886")) {
//                matchFee.setPrice(this.getIntlFee1());
//                matchFee.setCode(did.substring(2,5));
//            } else if (did.startsWith("001")) {
//                matchFee.setPrice(this.getIntlFee2());
//                matchFee.setCode("1");
//            } else {
//                matchFee.setPrice(this.getIntlFee3());
//                matchFee.setCode("");
//            }
//            return matchFee;
//        }

        //return matchFee;
    }

}
