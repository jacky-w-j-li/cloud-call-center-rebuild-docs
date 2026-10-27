#!/bin/bash
# asterisk config scripts
# created by hansz
# usage : ./config.sh  -s 0 -e 9 -n "bj.ali.2"
# install package is pbx.tar.gz

yum -y install ipcalc

# Variable definition
package=/tools/pbx
#ip=`curl ifconfig.me`
#ip=`ifconfig   |grep -v 127| grep "inet addr" | awk '{print $2}'  | awk -F ":" '{print $2}'| tail -1`
#mask=`ifconfig   |grep -v 127| grep "inet addr" | awk '{print $4}'  | awk -F ":" '{print $2}'| head -1`
#n_ip=$ip
#n_ip=`ifconfig   |grep -v 127| grep "inet addr" | awk '{print $2}'  | awk -F ":" '{print $2}'| head -1`
ip="10.168.4.65"
mask="255.255.252.0"
n_ip="10.168.4.65"
n_ip_network=`ipcalc -n $n_ip $mask | awk -F "=" '{print $2}'`
log=/var/log




# Error message
function error_exit(){
     echo "This script usage is "
     echo "-s The instance Start_num"
     echo "-e The instance End_num"
     echo "-n The instance name "
     exit 1

}



# Arguments Choice
while getopts ":s:e:n:c:" arg
do
     case $arg in
          s)
               Start_num=$OPTARG
               ;;
          e)              
               End_num=$OPTARG
               ;;
          n)
               Instance_name=$OPTARG
               ;;
#          c)
#               Install_choice=$OPTARG
#               ;;
          ?)
               echo "Unknow arguments"
               echo "config.sh  -s 0 -e 9 -n 'bj.ali.2' "
               exit 1
               ;;
     esac
done


# Parameter determination
if [[ -z $Instance_name ]];then
     echo -e "\e[31myou must appoint the instance name\e[0m"
     error_exit
fi
if [[ -z $Start_num ]] && [[ -z $End_num ]];then
     echo -e "\e[32m The script will install 10 instance in this machine \e[0m"
     Start_num=0
     End_num=9
elif [[ $End_num -lt $Start_num ]];then
     echo -e "\e[31m The Start_num granter the  End_num\e[0m"
     error_exit
elif [[  $Start_num -lt 0 ]];then
     echo -e "\e[31m The Start_num was error\e[0m"
     error_exit
elif [[ $End_num -gt 9 ]];then
     echo -e "\e[31m The End_num was error\e[0m"
     error_exit
#elif [[ -z $Install_choice ]];then
#     echo -e "\e[32m The script will install pbx \e[0m"




fi


mv pbx.tar.gz /tools/ 2>/dev/null ;cd /tools;
# File judgment and File decompression
[ -f pbx.tar.gz ] || echo -e "\e[32m Not found the pbx.tar.gz to install\e[0m"
[ -f pbx.tar.gz ] || exit 1


/bin/tar xf pbx.tar.gz  1>> $log/config_pbx.log


# File modification
# Instance_name and instance port
sleep 8
echo -e "\e[32m Start config asterisk file \e[0m"
cp -f $package/asterisk.ali.tar /etc/asterisk/ && cd /etc/asterisk/
tar -xmvf asterisk.ali.tar  1>> $log/config_pbx.log
echo >/etc/asterisk/bj.ali.2.0/extensions_include.ael
echo >/etc/asterisk/bj.ali.2.0/musiconhold_include.conf
echo >/etc/asterisk/bj.ali.2.0/queues_include.conf
echo >/etc/asterisk/bj.ali.2.0/sip_include.conf
sed -i  '24,25s/13/12/'   /etc/asterisk/bj.ali.2.0/extensions.ael
rm -rf /etc/asterisk/bj.ali.2.0/accounts/
sed -i "s/120.55.74.105/$ip/g" /etc/asterisk/*/*

sed -i "s/localnet=10.174.110.0\/255.255.255.0/localnet=$n_ip_network\/$mask/"  /etc/asterisk/*/*

for i  in      `seq $Start_num $End_num`
do
cp bj.ali.2.0 $Instance_name.$i -R
sed -i "s/bj.ali.2.0/$Instance_name.$i/g"  $Instance_name.$i/*
sed -i "s/6060/606$i/g" $Instance_name.$i/*
sed -i "s/6030/603$i/g" $Instance_name.$i/*
done
rm -rf bj.ali.2.0
rm -rf asterisk.ali.tar

# install mrcp and instance port
sleep 8
echo -e "\e[32m Start config mrcp file \e[0m"
cd /tools/mrcp
tar -zxf unimrcp-deps-1.5.0.tar.gz && cd /tools/mrcp/unimrcp-deps-1.5.0/ && sh ./build-dep-libs.sh >> /var/log/unimrcp-deps-install.log && cd ../
tar -zxf unimrcp.tar.gz && cd unimrcp/ && yum install  -y libtool && ./bootstrap > /var/log/unimrcp-install.log && ./configure > /var/log/unimrcp-install.log && make >> /var/log/unimrcp-install.log && make install >> /var/log/unimrcp-install.log && cd ../
tar -zxf asterisk-unimrcp.tar.gz && cd asterisk-unimrcp-asterisk-unimrcp-1.0.0 && chmod 755 bootstrap && ./bootstrap > /var/log/mrcp-install.log && ./configure > /var/log/mrcp-install.log && mkdir -p /var/lib/asterisk/documentation/thirdparty && make >> /var/log/mrcp-install.log && make install >> /var/log/mrcp-install.log &&  cd ../

for i  in      `seq $Start_num $End_num`
do
cp /tools/mrcp/mrcp.conf /etc/asterisk/$Instance_name.$i/
#sed -i "s/118.190.141.217/47.97.56.41/g"  /etc/asterisk/$Instance_name.$i/mrcp.conf
sed -i "s/120.26.96.9/$ip/g"  /etc/asterisk/$Instance_name.$i/mrcp.conf
sed -i "s/5080/508$i/g" /etc/asterisk/$Instance_name.$i/mrcp.conf
sed -i "s/rtp-port-min = 31001/rtp-port-min = 3${i}001/" /etc/asterisk/$Instance_name.$i/mrcp.conf
sed -i "s/rtp-port-max = 32000/rtp-port-max = 3${i}999/" /etc/asterisk/$Instance_name.$i/mrcp.conf

done

# Create soft link
for s in `seq $Start_num $End_num`
do
mkdir -p /var/lib/asterisk/$Instance_name.$s
ln -s /dev/shm/astdb/astdb$Instance_name.$s /var/lib/asterisk/$Instance_name.$s/astdb 1>> $log/config_pbx.log
mkdir -p  /var/spool/asterisk/$Instance_name.$s
ln -s /dev/shm/monitor$Instance_name.$s/  /var/spool/asterisk/$Instance_name.$s/monitor
done




# mkdir
for i in  /etc/asterisk/ /var/lib/asterisk/   /var/spool/asterisk/ /var/run/asterisk/  /var/log/asterisk/  
do
     for j in `seq $Start_num $End_num`
     do
     mkdir -p  $i/$Instance_name.$j
     mkdir -p /var/spool/asterisk/$Instance_name.$j/monitor
     done
done

mkdir -p  /etc/asterisk/gateway
mkdir -p  /usr/lib/asterisk/modules
mkdir -p  /var/lib/asterisk/gateway
mkdir -p  /var/lib/asterisk
mkdir -p  /var/lib/asterisk/agi-bin
mkdir -p  /var/spool/asterisk/gateway
mkdir -p  /var/run/asterisk/gateway
mkdir -p  /var/log/asterisk/gateway


#      Add content to rc.local  /etc/profile /root/.bashrc
cat >>/etc/rc.local<<EOF
mkdir -p /dev/shm/astdb
EOF


for i in `seq $Start_num $End_num`
do
cat >>/etc/rc.local<<EOF
     touch /dev/shm/astdb/astdb$Instance_name.$i
     mkdir -p /dev/shm/monitor$Instance_name.$i
     mkdir -p /var/run/asterisk/$Instance_name.$i
     mkdir -p /var/spool/asterisk/$Instance_name.$i
     /usr/sbin/asterisk -g -C /etc/asterisk/$Instance_name.$i/asterisk.conf
     sleep 1
EOF
done
cat >>/etc/rc.local<<EOF
cp /usr/src/astdb/* /dev/shm/astdb/
mkdir -p /var/run/asterisk/gateway
mkdir -p /dev/shm/monitorgateway
/usr/sbin/asterisk -g -C /etc/asterisk/gateway/asterisk.conf
sleep 3
/opt/ass/ass.sh restart
sleep 3
/opt/nginx/sbin/nginx -c /opt/nginx/conf/nginx.conf
/opt/asteriskGuard/monitor.sh start
EOF

#echo "export LD_LIBRARY_PATH=/opt/kdxfServer" >> /etc/profile
for  i in `seq $Start_num $End_num`
do
cat >>/root/.bashrc<<EOF
     alias rasterisk$i='/usr/sbin/rasterisk -C /etc/asterisk/$Instance_name.$i/asterisk.conf'
EOF
done
echo "alias rasteriskg='/usr/sbin/rasterisk -C /etc/asterisk/gateway/asterisk.conf'" >>/root/.bashrc
echo "alias clpmsg='/data/clpms/bin/clpms_cli.sh'" >>/root/.bashrc
echo "source /etc/profile" >>/root/.bashrc

source /root/.bashrc
echo -e "\e[32m asterisk is ok \e[0m"


#     Deployment ASS  configuration file    
echo -e "\e[32m Start config ass \e[0m"
sleep 3
cd $package
tar -xvf  ass.tar -C /opt/ 1>> $log/config_pbx.log  ;cd /opt/ass/

#     modify  dialout.line  fileserver  district
#ip=`curl ifconfig.me` &
#sleep 30
#if [[ -z $ip ]];then
#     read -p "enter your ip address \n" ip
#fi
#
sed -i "s/dialout.line=10.1.12.100/dialout.line=$ip/" /opt/ass/server.conf
sed -i "s/local.ip=10.1.12.100/dialout.line=$ip/" /opt/ass/server.conf
sed -i "s/106.39.108.82:8081/$ip/" /opt/ass/server.conf

function shanghai(){
sed -i 's/district=010/district=021/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/021/' /etc/asterisk/gateway/extensions.ael 
}

function guangzhou(){
sed -i 's/district=010/district=020/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/020/' /etc/asterisk/gateway/extensions.ael
}
function shenzheng(){
sed -i 's/district=010/district=0755/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/0755/' /etc/asterisk/gateway/extensions.ael 
}
function hangzhou(){
sed -i 's/district=010/district=0571/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/0571/' /etc/asterisk/gateway/extensions.ael 
}
function chengdu(){
sed -i 's/district=010/district=028/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/028/' /etc/asterisk/gateway/extensions.ael 
}
function wuhan(){
sed -i 's/district=010/district=027/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/027/' /etc/asterisk/gateway/extensions.ael
}
function chongqing(){
sed -i 's/district=010/district=023/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/023/' /etc/asterisk/gateway/extensions.ael
}
function nanjing(){
sed -i 's/district=010/district=025/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/025/' /etc/asterisk/gateway/extensions.ael
}
function changsha(){
sed -i 's/district=010/district=0731/g' /opt/ass/server.conf 
sed -i -e{9,12,61}'s/010/0731/' /etc/asterisk/gateway/extensions.ael
}

[[ $Instance_name =~ "bj" ]]&& sed -i 's/district=010/district=010/g' /opt/ass/server.conf 
[[ $Instance_name =~ "sh" ]]&& shanghai
[[ $Instance_name =~ "gz" ]]&& guangzhou
[[ $Instance_name =~ "sz" ]]&& shenzheng
[[ $Instance_name =~ "hz" ]]&& hangzhou
[[ $Instance_name =~ "cd" ]]&& chengdu
[[ $Instance_name =~ "wh" ]]&& wuhan
[[ $Instance_name =~ "cq" ]]&& chongqing
[[ $Instance_name =~ "nj" ]]&& nanjing
[[ $Instance_name =~ "cs" ]]&& changsha
#sed -i  '31,35d' /opt/ass/server.conf
dos2unix /opt/ass/server.conf
sed -i  "2s/canreinvite=no/canreinvite=yes/" /etc/asterisk/gateway/sip_trunk.conf
dos2unix  /etc/asterisk/gateway/sip_trunk.conf


# change rtp port 
name=$Instance_name
for num in `seq 1 9`
do
     sed -i "s/rtpstart=10000/rtpstart=1${num}000/" /etc/asterisk/$name.$num/rtp.conf
     sed  -i  "s/rtpend=10999/rtpend=1${num}999/" /etc/asterisk/$name.$num/rtp.conf
     grep "rtpstart" /etc/asterisk/$name.$num/rtp.conf
     
     grep "rtpend" /etc/asterisk/$name.$num/rtp.conf
     
done

# ln -s gateway to astdb 
mkdir -p /var/lib/asterisk/gateway/
rm -rf /var/lib/asterisk/gateway/astdb
touch /dev/shm/astdb/astdbgateway
ln -s /dev/shm/astdb/astdbgateway  /var/lib/asterisk/gateway/astdb
mkdir -p /var/spool/asterisk/gateway/
ln -s /dev/shm/monitorgateway  /var/spool/asterisk/gateway/monitor



# add the instace 
for i in  `seq $Start_num $End_num`
do
cat >>/opt/ass/server.conf<<EOF


[$Instance_name.$i]
host=127.0.0.1
port=603$i
user=dishui
password=7moorcom

EOF
done
echo "JAVA_HOME=/opt/java/" >/opt/ass/config-vars.sh
echo -e "\e[32m ass is ok \e[0m"

#     Deployment kdxfServer configuration file    
#echo -e "\e[32m Start config kdxfServer\e[0m"
#sleep 3

cd $package
#tar -xvf kdxfServer.tar.gz -C /opt/ 1>> $log/config_pbx.log
#cd /opt/kdxfServer/
#echo "JAVA_HOME=/opt/java/" >/opt/kdxfServer/config-vars.sh
#echo "/opt/kdxfServer/kdxfServer.sh restart" >> /etc/rc.local
#echo -e "\e[32m kdxfServer is ok \e[0m"

#      Deployment asteriskGuard configuration file    
echo -e "\e[32m Start config asteriskGuard \e[0m"
sleep 3
cd $package
tar -xvf asteriskGuard-proxy.tar -C /opt 1>> $log/config_pbx.log
cd /opt/asteriskGuard/
sed -i "s/gz.ali.1/$Instance_name/g" asterisk.conf
dos2unix  asterisk.conf
sed -i 's/^asterisk.*/&,gateway:5072/1' asterisk.conf
dos2unix  asterisk.conf
sed -i "/^mail.*$/s//&,yunwei@7moor.com/g" asterisk.conf
dos2unix  asterisk.conf
echo -e "\e[32m asteriskGuard is ok \e[0m"

#     Deployment sipproxy configuration file    
#echo -e "\e[32m Start config sipproxy \e[0m"
#sleep 3
#cd $package
#tar -zxvf sipproxy.tar.gz -C /opt/ 1>> $log/config_pbx.log
#cd /opt/sipproxy
#sed -i "s/211.151.35.101/$ip/g"  */*

#echo -e "\e[32m sipproxy is ok \e[0m"

#     Deployment nginx configuration file  
#echo -e "\e[32m Start config aliServer \e[0m"
#cd $package
#cp aliTtsServer.tar.gz /opt
#cp aliAsrServer.tar.gz /opt
#cd /opt
#tar -zxvf aliTtsServer.tar.gz
#tar -zxvf aliAsrServer.tar.gz
#echo -e "\e[32m aliServer is ok \e[0m"

echo -e "\e[32m Start config nginx  \e[0m"
[ -d /opt/nginx  ] || echo "Sorry ,The nginx Not found in /opt ,Please config by yourself"
[ -d /opt/nginx  ] || exit 1
sleep 5
rm -rf /opt/nginx/conf/nginx.conf
/bin/cp -f  $package/nginx.conf  /opt/nginx/conf/
mkdir -p /opt/nginx/ssl
/bin/cp -f  $package/_.7moor.com.crt /opt/nginx/ssl/
/bin/cp -f  $package/_.7moor.com.key /opt/nginx/ssl/
cpu=`cat /proc/cpuinfo | grep "processor" | wc -l`
let "cpu2= $cpu * 1024"
sed -i "s/#user  nobody;/user  root;/g" /opt/nginx/conf/nginx.conf
sed -i "s/worker_connections  1024;/worker_connections  $cpu2;/g" /opt/nginx/conf/nginx.conf
sed -i "s/worker_processes  1;/worker_processes  auto;/g" /opt/nginx/conf/nginx.conf
/opt/nginx/sbin/nginx -t -c /opt/nginx/conf/nginx.conf

#sed -i '43,45d' /opt/nginx/conf/nginx.conf
#sed -i "43 a           access_log      off;\                \n                location / {\n                proxy_pass   http://127.0.0.1:8080;\n      } \n             location /monitor {\n      root   /var/spool/asterisk/; \nindex  index.html index.htm;\n      }     " /opt/nginx/conf/nginx.conf
echo "/opt/nginx/sbin/nginx -c /opt/nginx/conf/nginx.conf" >> /etc/rc.local
echo "0 0 * * * /srv/scripts/nginx_cutlog.sh" >> /var/spool/cron/root



echo -e "\e[32m Start config the clear_asterisklog scripts\e[0m"
mkdir -p /srv/scripts
cat >> /srv/scripts/clear_asterisklog.sh  << CRM
#!/bin/bash
#
#this script  clear asterisk log
#history
#wangxb  2014-8-25 Version 1.0
ls /var/log/asterisk/*/full > /tmp/alog_file
ls /var/log/asterisk/*/*log >> /tmp/alog_file
ls /var/log/asterisk/*/message >> /tmp/alog_file
ls /var/log/asterisk/*/cdr-csv/Master.csv>> /tmp/alog_file
d=\`date +%u\`
list=\$(cat /tmp/alog_file)
for file in \$list
do
cp \${file}{,_\${d}}
> \${file}
done
/bin/rm /tmp/alog_file
CRM

cat >> /srv/scripts/gateway_restart.sh  << CRM
#!/bin/bash
#zhangdw 20180802
  
TODAY=`date -d "today" +%Y-%m-%d-%H-%M-%S`
/usr/sbin/asterisk -r -C /etc/asterisk/gateway/asterisk.conf -vvvx 'restart now' 
echo "$TODAY" >>/var/log/gateway_restart.log
sleep 5
ps -ef |grep asterisk|grep gateway|egrep -v "vi|grep|cat" >>/var/log/gateway_restart.log
CRM

cat >> /srv/scripts/ass_monitor.sh  << 'CRM'
#!/bin/bash
##by zhangdw
proc_name="ass"        #进程名
today=`date -d "today" +%Y-%m-%d-%H-%M-%S`
proc_num()                      #查询进程数量
 {
        num=`ps -ef | grep $proc_name | grep -v grep |grep -v vi |grep  -v cloudmonitor | grep -v log| grep java | wc -l`
     return $num
 }
proc_num
number=$?
 if [ $number -eq 0 ]        #如果进程数量为0
 then                            #重新启动服务器，或者扩展其它内容。
 /opt/ass/ass.sh start
sleep 40
 echo  "ASS is down  $today " >> /var/log/ass_monitor.log
 else
 echo  "ASS running on $today " >> /var/log/ass_monitor.log
 fi
CRM

chmod a+x /srv/scripts/clear_asterisklog.sh
chmod +x /srv/scripts/gateway_restart.sh
chmod +x /srv/scripts/ass_monitor.sh
echo "0 1 * * * /srv/scripts/clear_asterisklog.sh" >>/var/spool/cron/root
echo "0 4 * * * /srv/scripts/gateway_restart.sh" >>/var/spool/cron/root
echo "* * * * * /srv/scripts/ass_monitor.sh" >>/var/spool/cron/root
echo "* * * * * sleep 15;/srv/scripts/ass_monitor.sh" >>/var/spool/cron/root
echo "* * * * * sleep 30;/srv/scripts/ass_monitor.sh" >>/var/spool/cron/root
echo "* * * * * sleep 45;/srv/scripts/ass_monitor.sh" >>/var/spool/cron/root
echo -e "\e[32m crontab  is  ok \e[0m "

[ -d /srv/scripts ] || mkdir /srv/scripts/
cat >>/srv/scripts/nginx_cutlog.sh<< EOF
#! /bin/bash
## Nginx 日志分割脚本
## by wangxb
LOGS_PATH=/opt/nginx/logs
YESTERDAY=\`date -d "yesterday" +%Y-%m-%d\`
mv \${LOGS_PATH}/access.log \${LOGS_PATH}/access_\${YESTERDAY}.log
mv \${LOGS_PATH}/error.log \${LOGS_PATH}/error_\${YESTERDAY}.log
/usr/bin/find \${LOGS_PATH}/ -name "access_*" -mtime +5 -exec rm {} \;
/usr/bin/find \${LOGS_PATH}/ -name "error_*" -mtime +5 -exec rm {} \;
sleep 3
kill -USR1 \`cat /opt/nginx/logs/nginx.pid\`
EOF

chmod +x  /srv/scripts/nginx_cutlog.sh

echo -e "\e[32mDeployment complete\e[0m"




#echo -e "\e[32mStart add ipset iptables rules\e[0m "
#yum -y install ipset wget
#if [ $? -ne 0 ]; then
#    echo "yum install ipset is failed"
#    exit 1
#else
#    echo "yum install ipset is succeed"
#fi

####清空之前规则###
#iptables -F
##创建一个名为cnip的规则
#ipset -N cnip hash:net
#mkdir -pv /opt/ipset/
#cd /opt/ipset/
##下载国家IP段，这里以中国为例
#wget -P . http://www.ipdeny.com/ipblocks/data/countries/cn.zone
##将IP段添加到cnip规则中
#for i in $(cat /opt/ipset/cn.zone); do ipset -A cnip $i; done
#iptables -I INPUT -p tcp -m set --match-set cnip src -j ACCEPT
#iptables -I INPUT -p udp -m set --match-set cnip src -j ACCEPT
#iptables -I INPUT -p udp -s 127.0.0.1/8 -j ACCEPT
#iptables -I INPUT -p udp -s 10.0.0.0/8 -j ACCEPT
#iptables -I INPUT -p udp -s 172.0.0.0/8 -j ACCEPT
#iptables -I INPUT -p udp -s 192.168.0.0/16 -j ACCEPT
#iptables -A INPUT -p udp --dport 5072 -j DROP
#iptables -A INPUT -p udp --dport 6060:6069 -j DROP
#iptables -A INPUT -p udp --dport 5080:5089 -j DROP
#iptables -A INPUT -s 103.145.13.0/24 -j DROP
#iptables -A INPUT -s 5.196.0.0/16 -j DROP
#iptables -A INPUT -s 45.125.65.0/24 -j DROP
#iptables -A INPUT -s 167.114.0.0/16 -j DROP
#iptables -A INPUT -s 167.144.0.0/16 -j DROP
#iptables -A INPUT -s 176.114.0.0/16 -j DROP
#iptables -A INPUT -s 176.144.0.0/16 -j DROP
#
#[ $? != 0 ] && err_exit -e  "\e[31m ipset iptables add is error\e[0m"
#printf  "\n\e[32m -----ipset iptables add is done-----\n\e[0m "
