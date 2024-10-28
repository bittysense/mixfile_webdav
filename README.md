## MixFileWebDAV服务器
可挂载到Alist中 \
安装nodejs,输入npm i 安装依赖 \
node app.js启动服务 \
config.js中配置mixfile服务器地址和webdav端口 \
alist中创建新的webdav驱动,填写http://ip:端口即可,例如http://127.0.0.1:1900/ \
文件直链响应头x-mix-code为文件分享码 \
目前不支持移动文件