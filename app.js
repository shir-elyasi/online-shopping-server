const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require("cors");
const connectionDB = require('./data/database')


const indexRouter = require('./routes/index');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const categoriesRouter = require('./routes/categories');
const couponsRouter = require('./routes/coupons');


const app = express();

const corsOptions = {
  origin: "http://localhost:8080",
  optionsSuccessStatus:200,
}


app.use(cors())
app.use(express.json(corsOptions))

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range')
  next()
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/', indexRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/categories', categoriesRouter);
app.use('/coupons', couponsRouter);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
