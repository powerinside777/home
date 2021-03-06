// app/routes.js

var currentuser =""
var alarmsend = require('../app/alarm.js');
module.exports = function(app, passport,Alarmstate) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {

console.log('hello')
		res.render('../web/pages-login.ejs', { message: req.flash('loginMessage') });
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('../web/pages-login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '#', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	/*app.get('/signup', function(req, res) {

		//render the page and pass in any flash data if it exists
		res.render('../web/signup.ejs', { message: req.flash('signupMessage') });
	});
*/


	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		currentuser = req.user.email
			console.log(req.code)
		res.render('../web/index.ejs', {
			user : req.user // get the user out of session and pass to template

		});

	});

	// process the signup form
	/*app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/login', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
*/
	app.post('/arm', isLoggedIn, function(req, res) {
    Alarmstate =true;
    console.log(Alarmstate)
    res.send('ok')

	});
  app.post('/disarm', isLoggedIn, function(req, res) {
    Alarmstate =false;
    console.log(Alarmstate)
    res.send('ok')

  });
	app.post('/savecode', isLoggedIn, function(req, res) {

		User.findOne({ 'local.email' :  "josh" }, function(err, user) {
			// if there are any errors, return the error

			user.local.code = req.code;
				// save the user
				user.save(function(err) {
					if (err)
					{
						res.json({
							state:"error"

					});
					}
					else
						res.json({
							state:"success"
						});
				});
			});

		});
  app.get('/alarm.json', isLoggedIn, function(req, res) {

    if(Alarmstate == true) {

      res.json({
        "Status": 'on'
      })
    }
    else if(Alarmstate == false) {

      res.json({
        "Status": 'off'
      })
    }
  });

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
};


// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
