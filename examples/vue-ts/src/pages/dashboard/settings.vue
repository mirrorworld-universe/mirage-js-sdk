<template>
  <chakra.main p="10">
    <c-stack spacing="5">
      <c-heading>
        <c-icon color="emerald.500" name="settings" size="0.8em" />
        Settings
      </c-heading>
      <c-text color="gray.500">Customize application settings</c-text>
      <c-divider color="gray.300"></c-divider>
      <chakra.section py="4" px="5" bg="gray.50" rounded="lg">
        <c-stack>
          <c-heading as="h3" color="gray.700" size="md">User cohorts</c-heading>
          <c-text>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam, quis. Nostrum quo natus nobis. Temporibus nihil exercitationem nam ad maiores voluptatum neque quo recusandae. Ad nam ab sunt ipsum eius.
          </c-text>
          <c-h-stack>
            <c-app-link to="/dashboard/reports" left-icon="settings">
              View reports
            </c-app-link>
          </c-h-stack>
          <c-button align-self="start" size="sm" as="a" left-icon="github" href="https://github.com/codebender828/chakra-ui-chidori-starter/blob/main/src/pages/dashboard/settings.vue" target="_blank" variant="outline" color-scheme="gray">
            View source
          </c-button>
        </c-stack>
      </chakra.section>
    </c-stack>
  </chakra.main>
</template>

<route lang="yaml">
meta:
  layout: dashboard
</route>