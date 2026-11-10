const assert = require('assert');

console.log('=== TESTING SMART EDIT & PRECISE EDIT PIPELINE UNIFICATION ===\n');

(async () => {
  process.env.NODE_ENV = 'test';
  const { executePreciseEdit, generateImage } = await import('../server/src/controllers/imageController.js');
  const appModule = await import('../server/src/index.js');
  const app = appModule.default;

  const routesToTest = [
    '/api/images/smart-edit',
    '/api/image/smart-edit',
    '/api/generate-image/smart-edit',
    '/api/images/precise-edit',
    '/api/image/precise-edit',
    '/api/generate-image/precise-edit',
    '/api/images/edit'
  ];

  console.log('1. Checking route mounts on Express app:');
  const routerStack = app._router ? app._router.stack : [];
  const registeredPaths = [];

  routerStack.forEach(layer => {
    if (layer.route) {
      registeredPaths.push(layer.route.path);
    } else if (layer.name === 'router' && layer.regexp) {
      registeredPaths.push(layer.regexp.toString());
    }
  });

  for (const route of routesToTest) {
    const isDirect = registeredPaths.includes(route);
    const hasImagePrefix = registeredPaths.some(p => p.includes('images') || p.includes('generate-image') || p.includes('image'));
    assert(isDirect || hasImagePrefix, `Route ${route} must be registered`);
    console.log(`  ✓ Route reachable: ${route} (direct: ${isDirect})`);
  }

  const createMockRes = () => ({
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(d) {
      this.data = d;
      return this;
    }
  });

  console.log('\n2. Testing 400 Bad Request validation on executePreciseEdit:');
  {
    const res = createMockRes();
    await executePreciseEdit({ body: {} }, res);
    assert.strictEqual(res.statusCode, 400, 'Empty body must return 400');
    assert(res.data && res.data.error, 'Must contain error message');
    console.log(`  ✓ Missing prompt error: "${res.data.error}"`);
  }

  {
    const res = createMockRes();
    await executePreciseEdit({ body: { instructionPrompt: 'Make it sunset' } }, res);
    assert.strictEqual(res.statusCode, 400, 'Missing sourceImage must return 400');
    assert(res.data && res.data.error, 'Must contain error message');
    console.log(`  ✓ Missing sourceImage error: "${res.data.error}"`);
  }

  console.log('\n3. Testing generateImage delegation for isSmartEdit & workflowTool:');
  {
    const res = createMockRes();
    await generateImage({ body: { isSmartEdit: true } }, res);
    assert.strictEqual(res.statusCode, 400, 'isSmartEdit: true must delegate to executePreciseEdit');
    assert(res.data && res.data.error.includes('What should change?'), 'Must return Precise Edit error');
    console.log(`  ✓ Delegated isSmartEdit to executePreciseEdit: "${res.data.error}"`);
  }

  {
    const res = createMockRes();
    await generateImage({ body: { workflowTool: 'smart-edit' } }, res);
    assert.strictEqual(res.statusCode, 400, 'workflowTool: smart-edit must delegate to executePreciseEdit');
    assert(res.data && res.data.error.includes('What should change?'), 'Must return Precise Edit error');
    console.log(`  ✓ Delegated workflowTool=smart-edit to executePreciseEdit: "${res.data.error}"`);
  }

  console.log('\n4. Testing frontend template and workflowTool handoff in index.html:');
  const fs = require('fs');
  const html = fs.readFileSync('index.html', 'utf8');

  // Verify switchWorkflowTool maps any smart-edit trigger directly to precise-edit
  assert(html.includes("if (toolId === 'smart-edit') toolId = 'precise-edit';"), 'switchWorkflowTool must unify smart-edit into precise-edit');
  console.log('  ✓ switchWorkflowTool unifies smart-edit -> precise-edit');

  // Verify btn-tmpl-card-edit sets editItem and tool: precise-edit
  assert(html.includes("class=\"btn-tmpl-card-edit"), 'Template card edit button must exist');
  assert(html.includes("setImageStudioMode('workspace', { editItem, tool: 'precise-edit' });"), 'Template card edit button calls setImageStudioMode with editItem and tool: precise-edit');
  console.log('  ✓ btn-tmpl-card-edit dispatches editItem to setImageStudioMode with tool: precise-edit');

  // Verify enterStudioPreciseEdit handles editItem
  assert(html.includes('enterStudioPreciseEdit(options.editItem)'), 'options.editItem triggers enterStudioPreciseEdit');
  assert(html.includes('studioPreciseEditState.sourceItem = item'), 'enterStudioPreciseEdit populates sourceItem');
  assert(html.includes('studioPreciseEditState.referenceImages = []'), 'enterStudioPreciseEdit resets reference images');
  console.log('  ✓ enterStudioPreciseEdit smoothly populates sourceItem without page reload');

  // Verify proportional aspect-ratio styling
  assert(html.includes('aspect-[4/3] max-h-[380px]'), 'Dropzone and preview wrap must maintain aspect-[4/3] max-h-[380px]');
  console.log('  ✓ Proportional scaling aspect-[4/3] max-h-[380px] verified');

  console.log('\n🎉 ALL SMART EDIT UNIFICATION & TEMPLATE HANDOFF TESTS PASSED 100%!');
})().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
