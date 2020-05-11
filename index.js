var express = require('express')
var app = express();
const PORT = process.env.PORT = 3336;

app.listen(PORT,() => {
    console.log('Server is running at:',PORT)
});

var mysql = require('mysql2/promise');

var pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "0613",
    database: "crud"
});


/*
connection.connect(function(err){
    if (err) {
        console.log ('connected error');
    }
    console.log('Database is connected successfully!');
});
*/

app.locals.pretty = true;
var ejs = require('ejs')
app.set('views', __dirname + '/views');
app.set('view engine','ejs');

var bodyParser = require('body-parser'); // post 방식 
app.use(bodyParser.json());
var urlencodedParser = app.use(bodyParser.urlencoded({ extended: false }));




app.get('/', function(req, res) {
  var sql = "SELECT * FROM board LEFT JOIN user ON board.user_id = user.id";
  pool.query(sql, function (err, rows) {
      // console.log(rows)
      if (err) console.error("err : " + err);
      res.render('list', {title: '게시판 리스트', rows: rows});
  });
});
/*
app.get('/board/read',function(req,res){
  var idx = req.query.id;
  console.log(idx)
  var sql = "SELECT name, title, create_time, content, password FROM board LEFT JOIN user ON board.user_id = user.id WHERE board.idx =?";
  pool.query(sql, idx,function(err,row){
    console.log(row)
    if (err) console.error(`err: ${err}`);
    res.render('read', {title:"글 상세보기",row:row[0]});
  });
});

// 안되면 하나하나 단계별로 log 찍어보고 뭐가 문제인지 확인.
// 그 전에 써서 통했던 거라도, 이번엔 상황이 바뀌지 않았는지 확인.. ? 같은 경우 await pool.getConnection() 하고 나서야 쓸 수 있는 거였음. 
// /board/read/:?id 는 path로 
*/

app.get('/board/read',function(req,res){
  var idx = req.query.id;
  console.log(idx)
  var sql = "SELECT name, title, create_time, content, password, idx FROM board LEFT JOIN user ON board.user_id = user.id WHERE idx = " + idx;
  pool.query(sql,function(err,row){
    if (err) console.error(`err: ${err}`);
    // console.log(row)
    res.render('read', {title:"글 상세보기",row:row[0]});
  });
});

app.post('/board/delete',function(req,res){
  var idx = req.body.idx
  console.log(idx)
  try{
    var sql = "DELETE board, user FROM board LEFT JOIN user ON board.user_id = user.id WHERE idx = " + idx;
    pool.query(sql, function(err){
      if (err) console.log(err)
      res.redirect('/')
    })
  }
  catch(e){
    console.log(e)
  }
});

app.post('/board/update',function(req,res){
  var name = req.body.name
  // var idx = req.idx
  var title = req.body.title
  var content = req.body.content
  var password = req.body.password
  var idx = req.body.idx
  // var datas = [name, title, content, password, idx]
  // console.log(datas)
// ? 이용해서 가져오는 법
// input값 hidden일때도 가져오는 법

  try{
    var sql = "UPDATE board LEFT JOIN user ON board.user_id = user.id SET user.name = '" + name + "' ,board.title = '" + title + "' ,board.content = '" + content + "' WHERE board.idx = " +idx+ " AND user.password = '" + password + "'" ;
    // console.log(sql) 에러나면 꼭 확인해서 워크벤치로 확인해보기!
    pool.query(sql, function (err,result_ud){
      // console.log(result_ud)
      if (err) console.error ('err : '+ err)
      console.log(result_ud)
      res.redirect('/')
    });
  }
  catch(e){
    console.log(e)
  }
});

app.route('/board/write') 
  .get(function (req, res) {
    res.render('write',{title: '글 작성하기'});
  })
  .post(async function (req, res) {
    const connection = await pool.getConnection(conn=> conn)
      try {
        var sql_u = "INSERT INTO user (name, age, password) VALUES (?,?,?)";
        let item_u = [
          req.body.name,
          req.body.age,
          req.body.password
        ]
        var insertId;
        await connection.beginTransaction(); // START TRANSACTION > transaction 알기 + transaction에 따른 pool 접근 방식 
        insertId = await connection.query(sql_u, item_u);
        insertId = insertId[0].insertId
      try {
        var sql_b = "INSERT INTO board (title, content, user_id, create_time ) VALUES (?,?,?,now())";
        console.log(sql_b)
        let item_b = [
          req.body.title,
          req.body.content,
          insertId
        ]
        console.log(item_b)
       

        await connection.query(sql_b,item_b);
        
      }
          catch(e){
            console.log('board Query Error')
            await connection.rollback();
            connection.release();
          };
    

      await connection.commit(); // COMMIT
      }
      catch(err){
        await connection.rollback(); // ROLLBACK
        connection.release();
        console.log('user Query Error');
        return false;
      };
      
      console.log('table is completed')
      connection.release();
      res.redirect('/');
    });
