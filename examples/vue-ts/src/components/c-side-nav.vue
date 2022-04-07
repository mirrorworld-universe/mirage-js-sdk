<template>
  <c-stack as="nav" p="4">
    <c-app-link left-icon="home" to="/">
      Home
    </c-app-link>
    <c-app-link left-icon="star" to="/dashboard/mint">
      Mint
    </c-app-link>
    <c-app-link left-icon="box" to="/dashboard/collection">
      Collection
    </c-app-link>
    <c-app-link left-icon="shopping-bag" to="/dashboard/auction">
      Auctions
    </c-app-link>
    <c-app-link left-icon="pie-chart" to="/dashboard/reports">
      Reports
    </c-app-link>
    <c-app-link left-icon="user" to="/accounts">
      Account
    </c-app-link>
  </c-stack>
</template>