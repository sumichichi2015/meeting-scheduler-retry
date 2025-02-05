<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">会議調整ツール</h1>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <main class="py-10">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
// コンポーネントのロジックはここに記述
</script>

<style>
@import './assets/main.css';
</style>
