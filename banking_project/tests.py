from django.test import TestCase, Client


class RootEndpointTest(TestCase):
    def test_root_endpoint(self):
        client = Client()
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"name": "Rush API", "version": "1.0"})
