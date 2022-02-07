const html404 = `
<!DOCTYPE html>
<body>
    <h1>404 Not Found.</h1>
    <p>The url you visit is not found.</p>
</body>
`

const html_no_ref = `
<!DOCTYPE html>
<html>
<head>
    <title>Url-Shorten-Worker</title>
    <meta http-equiv="Refresh" content="1; url={Replace}" />
    <meta name="referrer" content="no-referrer" />
</head>
<body>
    <p>Redirecting..<br /><a href="{Replace}">{Replace}</a></p>
    <script type="text/javascript">
        setTimeout('window.location.replace( "{Replace}" + window.location.hash );', 0 )
    </script>
</body>
</html>
`