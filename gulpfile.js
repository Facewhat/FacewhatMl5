/**
 * Created by Administrator on 2017/9/4.
 * html压缩替换未实现，请参考http://www.jb51.net/article/100652.htm
 * 暂时学习这些用法，未进行打包之类
 */
// 引入gulp
var gulp = require('gulp');

// 引入组件
var jshint = require('gulp-jshint'); // 代码检查
//var sass = require('gulp-sass');     // sass编译
//var less = require('gulp-less');     // less编译
var concat = require('gulp-concat'); // 代码合并
var uglify = require('gulp-uglify'); // 代码压缩
var rename = require('gulp-rename'); // 文件重命名
var cssmin = require('gulp-minify-css'); //css压缩
var clean = require('gulp-clean');    // 清理
var connect = require('gulp-connect'); // web服务器

//定义css、js源文件路径
var jsSrc = 'app/js/*.js',
    jsDist = 'dist/js',
    cssSrc = 'app/css/*.css',
    lessSrc = 'less/*.less',
    sassSrc = './scss/*.scss',
    cssDist = './dist/css',
    imgMinSrc = 'dist/images/*.{png,jpg,gif,ico}',
    htmlSrc = '*.html';

// 检查脚本，在命令行使用 gulp script 启动此任务（script为task名）
gulp.task('lint', function(){
   gulp.src(jsSrc)
       .pipe(jshint());
});

// 压缩 js 文件
gulp.task('scripts', function() {
   // 1\. 找到文件
   gulp.src(jsSrc)
       .pipe(concat('all.js'))
       .pipe(gulp.dest(jsDist))
       .pipe(rename('all.min.js'))
       .pipe(uglify()) //  压缩文件
       .pipe(gulp.dest(jsDist))
});

// 编译Sass
//gulp.task('sass', function() {
//   gulp.src(sassSrc)
//       .pipe(sass())
//       .pipe(gulp.dest(cssDist));
//});

// 编译less
// gulp.task('less', function(){
//    return gulp.src(lessSrc)
//        .pipe(less()) // 参数为空，编译为css
//        .pipe(gulp.dest(cssDist)) // 另存为文件
//        .pipe(cssmin()) // 压缩css
//        .pipe(gulp.dest(cssDist));
// });

//当所有less文件发生改变时，调用testLess任务
// gulp.task('watchLess', function () {
//    gulp.watch(lessSrc, ['less']);
// });

// 压缩css文件
gulp.task('minCss', function(){
   gulp.src(cssSrc)
       .pipe(cssmin()) // 压缩css
       .pipe(gulp.dest(cssDist));
});

// 监听css文件，当src/css/下所有css文件发生改变时，调用minCss任务
gulp.task('watchCss', function () {
   gulp.watch(cssSrc, ['minCss']);
});

// 在命令行使用 gulp auto 启动此任务
gulp.task('watchJs', function () {
   // 监听文件修改，当文件被修改则执行 script 任务
   gulp.watch('js/*.js', ['scripts'])
   //.watch('less/*.less', ['less'])
})

gulp.task('copy',  function() {
   return gulp.src('app/**/*')
       .pipe(gulp.dest('dist'))
});

gulp.task('clean', function(){
   return gulp.src('./dist/')
       .pipe(clean());
});

// 使用 gulp.task('default') 定义默认任务
// 在命令行使用 gulp 启动 script 任务和 auto 任务
// gulp.task('default', ['lint', 'less', 'scripts','watchCss'/*, 'auto'*/])
// 先执行clean再执行其他
//gulp.task('default', ['clean'], function(){
//   gulp.start('lint', 'less', 'scripts','watchCss');
//});

/*******************************************************************
 * 以上暂时不用等功能完成后用以打包
 * *
 ********************************************************************/

// 自动刷新浏览器
gulp.task('watcher',function(){
   gulp.watch('./app/**/*.*',['loadfiles']);
});

// 启动服务器
gulp.task('startServer',function(){
   connect.server({
      root:'app',
      ip:'10.10.123.155',
      port:9999,
      livereload:true
   });
});

gulp.task('stopServer',function(){
   connect.serverClose();
});

gulp.task('loadfiles', function(){
   gulp.src('./app/**/*.*')
       .pipe(connect.reload());
});

gulp.task('default',['startServer','watcher'])