<%@ page session="true" %>
<%
    if(session == null || session.getAttribute("username") == null) {
        response.sendRedirect("login.jsp");
        return;
    }
%>

<html>
<body>
    <h1>DASHBOARD</h1>
<h2>Welcome, <%= session.getAttribute("username") %></h2>
<a href="LogoutServlet">Logout</a>
</body>
</html>
